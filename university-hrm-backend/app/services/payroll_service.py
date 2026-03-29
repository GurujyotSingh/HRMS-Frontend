from datetime import datetime, timezone
from sqlalchemy import select, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.payroll import SalaryStructure, Payslip
from app.db.models.attendance import Attendance
from app.db.models.leave import Leave
from app.db.models.enums import LeaveStatus
from app.schemas.payroll import SalaryStructureCreate, PayslipGenerate, PayslipSummary, PayslipRead


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _round2(val: float) -> float:
    return round(val, 2)


# ── Salary Structure ──────────────────────────────────────────────────────────

async def set_salary_structure(
    db: AsyncSession, employee_id: int, data: SalaryStructureCreate
) -> SalaryStructure:
    """HR creates or updates an employee's salary structure."""
    result = await db.execute(
        select(SalaryStructure).where(SalaryStructure.employee_id == employee_id)
    )
    structure = result.scalar_one_or_none()

    if structure:
        # Update existing
        for field, value in data.model_dump().items():
            setattr(structure, field, value)
        structure.updated_at = _utcnow()
    else:
        structure = SalaryStructure(employee_id=employee_id, **data.model_dump())
        db.add(structure)

    await db.commit()
    await db.refresh(structure)
    return structure


async def get_salary_structure(db: AsyncSession, employee_id: int) -> SalaryStructure | None:
    result = await db.execute(
        select(SalaryStructure).where(SalaryStructure.employee_id == employee_id)
    )
    return result.scalar_one_or_none()


# ── Payslip calculation ───────────────────────────────────────────────────────

async def _get_attendance_stats(
    db: AsyncSession, employee_id: int, month: int, year: int, working_days: int
) -> tuple[int, int, int]:
    """
    Returns (days_present, days_absent, days_on_leave).
    days_on_leave = approved leaves in that month (counted as present, not deducted).
    days_absent   = working_days - days_present - days_on_leave
    """
    # Count attendance records marked "present"
    att_result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == employee_id,
            extract("month", Attendance.date) == month,
            extract("year", Attendance.date) == year,
            Attendance.status == "present",
        )
    )
    days_present = len(att_result.scalars().all())

    # Count approved leaves in this month
    leave_result = await db.execute(
        select(Leave).where(
            Leave.employee_id == employee_id,
            Leave.status == LeaveStatus.APPROVED,
            extract("month", Leave.start_date) == month,
            extract("year", Leave.start_date) == year,
        )
    )
    approved_leaves = leave_result.scalars().all()
    days_on_leave = sum(
        (l.end_date - l.start_date).days + 1 for l in approved_leaves
    )

    days_absent = max(working_days - days_present - days_on_leave, 0)
    return days_present, days_absent, days_on_leave


def _calculate_payslip(
    structure: SalaryStructure,
    days_present: int,
    days_absent: int,
    days_on_leave: int,
) -> dict:
    """
    Core calculation logic.
    Absent days cause per-day deduction.
    Leave days are treated as paid (no deduction).
    TDS is applied on gross after other deductions.
    """
    working_days = structure.working_days_per_month
    per_day_rate = float(structure.basic_salary) / working_days

    # Prorate all earnings by (present + on_leave) / working_days
    paid_days = days_present + days_on_leave
    ratio = paid_days / working_days if working_days > 0 else 0

    basic = _round2(float(structure.basic_salary) * ratio)
    hra = _round2(float(structure.hra) * ratio)
    ta = _round2(float(structure.ta) * ratio)
    da = _round2(float(structure.da) * ratio)
    other = _round2(float(structure.other_allowances) * ratio)
    gross = _round2(basic + hra + ta + da + other)

    # Deductions
    absent_deduction = _round2(per_day_rate * days_absent)
    pf = _round2(float(structure.pf_deduction))
    prof_tax = _round2(float(structure.professional_tax))
    tds = _round2(gross * float(structure.tds_rate) / 100)

    total_deductions = _round2(absent_deduction + pf + prof_tax + tds)
    net_pay = _round2(gross - total_deductions)

    return {
        "working_days": working_days,
        "days_present": days_present,
        "days_absent": days_absent,
        "days_on_leave": days_on_leave,
        "basic_salary": basic,
        "hra": hra,
        "ta": ta,
        "da": da,
        "other_allowances": other,
        "gross_salary": gross,
        "absent_deduction": absent_deduction,
        "pf_deduction": pf,
        "professional_tax": prof_tax,
        "tds_deduction": tds,
        "total_deductions": total_deductions,
        "net_pay": net_pay,
    }


# ── Generate payslip ──────────────────────────────────────────────────────────

async def generate_payslip(db: AsyncSession, data: PayslipGenerate) -> Payslip:
    """
    HR generates a payslip for an employee for a given month/year.
    - Fetches salary structure
    - Fetches attendance stats
    - Calculates gross, deductions, net pay
    - Saves as draft (HR can finalize later)
    """
    # Check if payslip already exists
    existing = await db.execute(
        select(Payslip).where(
            Payslip.employee_id == data.employee_id,
            Payslip.month == data.month,
            Payslip.year == data.year,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError(f"Payslip for month {data.month}/{data.year} already exists. Use update endpoint.")

    structure = await get_salary_structure(db, data.employee_id)
    if not structure:
        raise ValueError("No salary structure found for this employee. Set it first.")

    days_present, days_absent, days_on_leave = await _get_attendance_stats(
        db, data.employee_id, data.month, data.year, structure.working_days_per_month
    )

    calc = _calculate_payslip(structure, days_present, days_absent, days_on_leave)

    payslip = Payslip(
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        notes=data.notes,
        status="draft",
        generated_at=_utcnow(),
        **calc,
    )
    db.add(payslip)
    await db.commit()
    await db.refresh(payslip)
    return payslip


async def finalize_payslip(db: AsyncSession, payslip_id: int) -> Payslip:
    """HR finalizes a draft payslip — employee can view it after this."""
    result = await db.execute(select(Payslip).where(Payslip.id == payslip_id))
    payslip = result.scalar_one_or_none()
    if not payslip:
        raise ValueError("Payslip not found")
    if payslip.status == "finalized":
        raise ValueError("Payslip already finalized")

    payslip.status = "finalized"
    payslip.finalized_at = _utcnow()
    await db.commit()
    await db.refresh(payslip)
    return payslip


async def regenerate_payslip(db: AsyncSession, payslip_id: int) -> Payslip:
    """HR recalculates an existing draft payslip (e.g. attendance was updated)."""
    result = await db.execute(select(Payslip).where(Payslip.id == payslip_id))
    payslip = result.scalar_one_or_none()
    if not payslip:
        raise ValueError("Payslip not found")
    if payslip.status == "finalized":
        raise ValueError("Cannot regenerate a finalized payslip")

    structure = await get_salary_structure(db, payslip.employee_id)
    if not structure:
        raise ValueError("Salary structure not found")

    days_present, days_absent, days_on_leave = await _get_attendance_stats(
        db, payslip.employee_id, payslip.month, payslip.year, structure.working_days_per_month
    )

    calc = _calculate_payslip(structure, days_present, days_absent, days_on_leave)
    for field, value in calc.items():
        setattr(payslip, field, value)

    payslip.generated_at = _utcnow()
    await db.commit()
    await db.refresh(payslip)
    return payslip


# ── Queries ───────────────────────────────────────────────────────────────────

async def get_employee_payslips(db: AsyncSession, employee_id: int) -> list[Payslip]:
    """Employee: own finalized payslips only."""
    result = await db.execute(
        select(Payslip)
        .where(
            Payslip.employee_id == employee_id,
            Payslip.status == "finalized",
        )
        .order_by(Payslip.year.desc(), Payslip.month.desc())
    )
    return result.scalars().all()


async def get_payslip_by_month(
    db: AsyncSession, employee_id: int, month: int, year: int
) -> Payslip | None:
    result = await db.execute(
        select(Payslip).where(
            Payslip.employee_id == employee_id,
            Payslip.month == month,
            Payslip.year == year,
        )
    )
    return result.scalar_one_or_none()


async def get_monthly_summary(db: AsyncSession, month: int, year: int) -> PayslipSummary:
    """HR: payroll summary across all employees for a given month."""
    result = await db.execute(
        select(Payslip).where(
            Payslip.month == month,
            Payslip.year == year,
        )
    )
    payslips = result.scalars().all()

    return PayslipSummary(
        month=month,
        year=year,
        total_employees=len(payslips),
        total_gross=_round2(sum(float(p.gross_salary) for p in payslips)),
        total_deductions=_round2(sum(float(p.total_deductions) for p in payslips)),
        total_net_pay=_round2(sum(float(p.net_pay) for p in payslips)),
        payslips=[PayslipRead.model_validate(p) for p in payslips],
    )


async def get_all_payslips_for_hr(
    db: AsyncSession, month: int | None = None, year: int | None = None
) -> list[Payslip]:
    query = select(Payslip)
    if month:
        query = query.where(Payslip.month == month)
    if year:
        query = query.where(Payslip.year == year)
    query = query.order_by(Payslip.year.desc(), Payslip.month.desc(), Payslip.employee_id)
    result = await db.execute(query)
    return result.scalars().all()