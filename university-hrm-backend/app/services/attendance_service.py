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

    from app.db.models.system_setting import SystemSetting
    setting = await db.scalar(select(SystemSetting).limit(1))
    
    late_threshold = DEFAULT_LATE_THRESHOLD
    if setting and setting.work_start_time:
        try:
            h, m = map(int, setting.work_start_time.split(':'))
            base_time = datetime.combine(today, time(h, m))
            threshold = base_time + timedelta(minutes=setting.late_threshold_minutes)
            late_threshold = threshold.time()
        except Exception:
            pass

    is_late = now.time() > late_threshold

    record = Attendance(
        id=str(uuid.uuid4()),
        employee_id=employee_id,
        date=today,
        check_in=now,
        is_late=is_late,
        status="PRESENT",  # enum fix
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
    from app.db.models.system_setting import SystemSetting
    setting = await db.scalar(select(SystemSetting).limit(1))
    
    shift_end_time = DEFAULT_SHIFT_END
    if setting and setting.work_end_time:
        try:
            h, m = map(int, setting.work_end_time.split(':'))
            shift_end_time = time(h, m)
        except Exception:
            pass
            
    shift_end = datetime.combine(today, shift_end_time).replace(tzinfo=TZ)

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
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Attendance)
        .options(selectinload(Attendance.employee))
        .where(Attendance.date == _today())
        .order_by(Attendance.employee_id)
    )
    return result.scalars().all()


async def update_attendance_by_hr(db: AsyncSession, attendance_id: str, updates: dict) -> Attendance:
    result = await db.execute(select(Attendance).where(Attendance.id == attendance_id))
    att = result.scalar_one_or_none()
    if not att:
        raise ValueError("Attendance record not found")
        
    # Validation: Ensure check_in and check_out are on the same date as the attendance record
    if "check_in" in updates and updates["check_in"]:
        in_time = updates["check_in"]
        local_date = in_time.astimezone(TZ).date() if in_time.tzinfo else in_time.date()
        if local_date != att.date:
            raise ValueError(f"Clock In date ({local_date}) must match the attendance record date ({att.date}).")
            
    if "check_out" in updates and updates["check_out"]:
        out_time = updates["check_out"]
        local_date = out_time.astimezone(TZ).date() if out_time.tzinfo else out_time.date()
        if local_date != att.date:
            raise ValueError(f"Clock Out date ({local_date}) must match the attendance record date ({att.date}).")

    for k, v in updates.items():
        if hasattr(att, k) and v is not None:
            setattr(att, k, v)
            
    # Validation: Ensure check_out is after check_in
    if att.check_in and att.check_out:
        if att.check_out <= att.check_in:
            raise ValueError("Clock Out time must be after Clock In time.")
            
    # Recalculate hours
    if att.check_in and att.check_out:
        att.total_hours = _calculate_hours(att.check_in, att.check_out)
        
    att.updated_at = _now()
    await db.commit()
    await db.refresh(att)
    return att