from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select, extract, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.attendance import Attendance, LATE_THRESHOLD, SHIFT_END_TIME
from app.schemas.attendance import AttendanceSummary, AttendanceRead

# ── Timezone — change to your university's timezone ──────────────────────────
TZ = ZoneInfo("Asia/Kolkata")   # IST — change if needed


def _now() -> datetime:
    return datetime.now(TZ)


def _today() -> date:
    return _now().date()


def _calculate_hours(clock_in: datetime, clock_out: datetime) -> float:
    delta = clock_out - clock_in
    hours = delta.total_seconds() / 3600
    return round(hours, 2)


# ── Clock In ──────────────────────────────────────────────────────────────────

async def clock_in(db: AsyncSession, employee_id: int) -> Attendance:
    today = _today()
    now = _now()

    # Check if already clocked in today
    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.date == today,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("Already clocked in today. Only one clock-in per day allowed.")

    is_late = now.time() > LATE_THRESHOLD

    record = Attendance(
        employee_id=employee_id,
        date=today,
        clock_in=now,
        is_late=is_late,
        status="present",
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


# ── Clock Out ─────────────────────────────────────────────────────────────────

async def clock_out(db: AsyncSession, employee_id: int) -> Attendance:
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
        raise ValueError("You have not clocked in today.")
    if record.clock_out is not None:
        raise ValueError("Already clocked out today.")

    record.clock_out = now
    record.total_hours = _calculate_hours(record.clock_in, now)
    await db.commit()
    await db.refresh(record)
    return record


# ── Auto clock-out (called by HR or scheduled job) ───────────────────────────

async def auto_clock_out_missing(db: AsyncSession) -> int:
    """
    Finds all records from today that have clock_in but no clock_out,
    and sets clock_out = SHIFT_END_TIME, marks is_auto_clocked_out = True.
    Returns count of records updated.
    Call this endpoint at end of day (e.g. 7 PM via cron or HR manually).
    """
    today = _today()

    # Build shift end datetime in correct timezone
    shift_end = datetime.combine(today, SHIFT_END_TIME).replace(tzinfo=TZ)

    result = await db.execute(
        select(Attendance).where(
            Attendance.date == today,
            Attendance.clock_in.isnot(None),
            Attendance.clock_out.is_(None),
        )
    )
    records = result.scalars().all()

    count = 0
    for record in records:
        record.clock_out = shift_end
        record.total_hours = _calculate_hours(record.clock_in, shift_end)
        record.is_auto_clocked_out = True
        count += 1

    await db.commit()
    return count


# ── Today's status ────────────────────────────────────────────────────────────

async def get_today_status(db: AsyncSession, employee_id: int) -> Attendance | None:
    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            Attendance.date == _today(),
        )
    )
    return result.scalar_one_or_none()


# ── Own history ───────────────────────────────────────────────────────────────

async def get_own_attendance(
    db: AsyncSession,
    employee_id: int,
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


# ── Monthly summary ───────────────────────────────────────────────────────────

async def get_monthly_summary(
    db: AsyncSession,
    employee_id: int,
    month: int,
    year: int,
) -> AttendanceSummary:
    records = await get_own_attendance(db, employee_id, month, year)

    total_present = sum(1 for r in records if r.status == "present")
    total_late = sum(1 for r in records if r.is_late)
    total_on_leave = sum(1 for r in records if r.status == "on_leave")
    total_absent = sum(1 for r in records if r.status == "absent")
    total_hours = sum(float(r.total_hours) for r in records if r.total_hours is not None)

    return AttendanceSummary(
        employee_id=employee_id,
        month=month,
        year=year,
        total_days_present=total_present,
        total_days_late=total_late,
        total_days_absent=total_absent,
        total_days_on_leave=total_on_leave,
        total_hours_worked=round(total_hours, 2),
        records=[AttendanceRead.model_validate(r) for r in records],
    )


# ── HR: view any employee's attendance ───────────────────────────────────────

async def get_employee_attendance_for_hr(
    db: AsyncSession,
    employee_id: int,
    month: int,
    year: int,
) -> list[Attendance]:
    return await get_own_attendance(db, employee_id, month, year)


async def get_all_attendance_today(db: AsyncSession) -> list[Attendance]:
    """HR: see all clock-ins for today across all employees."""
    result = await db.execute(
        select(Attendance)
        .options(selectinload(Attendance.employee))
        .where(Attendance.date == _today())
        .order_by(Attendance.employee_id)
    )
    return result.scalars().all()