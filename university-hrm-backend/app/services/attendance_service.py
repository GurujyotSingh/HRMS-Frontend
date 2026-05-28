"""
Attendance service — updated for actual DB schema.
DB uses check_in / check_out (not clock_in / clock_out).
PKs are VARCHAR UUID strings.
LATE_THRESHOLD and SHIFT_END_TIME come from system_settings table,
defaulting to 09:15 and 18:00 respectively.
"""
import uuid
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo
from typing import Optional

from sqlalchemy import select, extract, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.attendance import Attendance

TZ = ZoneInfo("Asia/Kolkata")

# Default thresholds — ideally from system_settings but used as fallback
DEFAULT_LATE_THRESHOLD = time(9, 15)
DEFAULT_SHIFT_END = time(18, 0)


def _now() -> datetime:
    return datetime.now(TZ)


def _today() -> date:
    return _now().date()


def _calculate_hours(check_in: datetime, check_out: datetime) -> float:
    delta = check_out - check_in
    return round(delta.total_seconds() / 3600, 2)


async def clock_in(db: AsyncSession, employee_id: str) -> Attendance:
    """Record check-in for today. Raises if already checked in."""
    today = _today()
    now = _now()

    existing = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.date == today,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Already checked in today")

    is_late = now.time() > DEFAULT_LATE_THRESHOLD

    record = Attendance(
        id=str(uuid.uuid4()),
        employee_id=employee_id,
        date=today,
        check_in=now,
        is_late=is_late,
        status="present",
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def clock_out(db: AsyncSession, employee_id: str) -> Attendance:
    """Record check-out for today. Raises if not checked in or already checked out."""
    today = _today()
    now = _now()

    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.date == today,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise ValueError("You have not checked in today")
    if record.check_out is not None:
        raise ValueError("Already checked out today")

    record.check_out = now
    record.total_hours = _calculate_hours(record.check_in, now)
    record.updated_at = now
    await db.commit()
    await db.refresh(record)
    return record


async def auto_clock_out_missing(db: AsyncSession) -> int:
    """Auto check-out all employees still checked in at end of day."""
    today = _today()
    shift_end = datetime.combine(today, DEFAULT_SHIFT_END).replace(tzinfo=TZ)

    result = await db.execute(
        select(Attendance).where(
            Attendance.date == today,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None),
        )
    )
    records = result.scalars().all()
    count = 0
    for record in records:
        record.check_out = shift_end
        record.total_hours = _calculate_hours(record.check_in, shift_end)
        record.updated_at = _now()
        count += 1
    await db.commit()
    return count


async def get_today_status(db: AsyncSession, employee_id: str) -> Optional[Attendance]:
    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.date == _today(),
        )
    )
    return result.scalar_one_or_none()


async def get_own_attendance(
    db: AsyncSession,
    employee_id: str,
    month: int,
    year: int,
) -> list[Attendance]:
    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            extract("month", Attendance.date) == month,
            extract("year", Attendance.date) == year,
        ).order_by(Attendance.date)
    )
    return result.scalars().all()


async def get_all_attendance_today(db: AsyncSession) -> list[Attendance]:
    """HR: all check-ins for today."""
    result = await db.execute(
        select(Attendance)
        .where(Attendance.date == _today())
        .order_by(Attendance.employee_id)
    )
    return result.scalars().all()


async def update_attendance_by_hr(db: AsyncSession, attendance_id: str, updates: dict) -> Attendance:
    result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
    att = result.scalar_one_or_none()
    if not att:
        raise ValueError("Attendance record not found")
    for k, v in updates.items():
        if hasattr(att, k) and v is not None:
            setattr(att, k, v)
    att.updated_at = _now()
    await db.commit()
    await db.refresh(att)
    return att