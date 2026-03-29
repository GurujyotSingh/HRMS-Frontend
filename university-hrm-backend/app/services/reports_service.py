from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.employee import Employee
from app.db.models.user import User
from app.db.models.role import Role
from app.db.models.department import Department
from app.db.models.leave import Leave
from app.db.models.attendance import Attendance
from app.db.models.payroll import Payslip
from app.db.models.onboarding import OnboardingRecord
from app.db.models.enums import LeaveStatus
from app.schemas.performance import (
    DeptRoleCount, LeaveStatsReport,
    AttendanceSummaryReport, PayrollCostReport, OnboardingReport,
)


# ── 1. Employee count by dept/role ────────────────────────────────────────────

async def employee_count_by_dept_role(db: AsyncSession) -> list[DeptRoleCount]:
    result = await db.execute(
        select(
            Department.name.label("department"),
            Role.name.label("role"),
            func.count(Employee.id).label("count"),
        )
        .join(User, Employee.user_id == User.id)
        .join(Role, User.role_id == Role.id)
        .outerjoin(Department, Employee.department_id == Department.id)
        .group_by(Department.name, Role.name)
        .order_by(Department.name, Role.name)
    )
    rows = result.all()
    return [
        DeptRoleCount(department=r.department, role=str(r.role), count=r.count)
        for r in rows
    ]


# ── 2. Leave stats ────────────────────────────────────────────────────────────

async def leave_stats(db: AsyncSession) -> LeaveStatsReport:
    result = await db.execute(select(Leave))
    all_leaves = result.scalars().all()

    return LeaveStatsReport(
        total=len(all_leaves),
        pending=sum(1 for l in all_leaves if l.status == LeaveStatus.PENDING),
        approved_by_hod=sum(1 for l in all_leaves if l.status == LeaveStatus.APPROVED_BY_HOD),
        approved=sum(1 for l in all_leaves if l.status == LeaveStatus.APPROVED),
        rejected=sum(1 for l in all_leaves if l.status == LeaveStatus.REJECTED),
        cancelled=sum(1 for l in all_leaves if l.status == LeaveStatus.CANCELLED),
    )


# ── 3. Attendance summary (all employees, given month/year) ───────────────────

async def attendance_summary(db: AsyncSession, month: int, year: int) -> list[AttendanceSummaryReport]:
    result = await db.execute(
        select(
            Employee.id,
            Employee.first_name,
            Employee.last_name,
            func.count(Attendance.id).filter(Attendance.status == "present").label("days_present"),
            func.count(Attendance.id).filter(Attendance.is_late == True).label("days_late"),
            func.coalesce(func.sum(Attendance.total_hours), 0).label("total_hours"),
        )
        .outerjoin(
            Attendance,
            (Attendance.employee_id == Employee.id) &
            (extract("month", Attendance.date) == month) &
            (extract("year", Attendance.date) == year)
        )
        .group_by(Employee.id, Employee.first_name, Employee.last_name)
        .order_by(Employee.first_name)
    )
    rows = result.all()

    # Standard working days in month (approximate)
    import calendar
    working_days = sum(
        1 for d in range(1, calendar.monthrange(year, month)[1] + 1)
        if calendar.weekday(year, month, d) < 5   # Mon-Fri
    )

    return [
        AttendanceSummaryReport(
            employee_id=r.id,
            employee_name=f"{r.first_name} {r.last_name}",
            days_present=r.days_present or 0,
            days_absent=max(working_days - (r.days_present or 0), 0),
            days_late=r.days_late or 0,
            total_hours=float(r.total_hours or 0),
        )
        for r in rows
    ]


# ── 4. Payroll cost report ────────────────────────────────────────────────────

async def payroll_cost_report(db: AsyncSession, month: int, year: int) -> PayrollCostReport:
    # Total summary
    result = await db.execute(
        select(Payslip).where(Payslip.month == month, Payslip.year == year)
    )
    payslips = result.scalars().all()

    # Group by department
    dept_result = await db.execute(
        select(
            Department.name.label("dept_name"),
            func.count(Payslip.id).label("emp_count"),
            func.sum(Payslip.gross_salary).label("total_gross"),
            func.sum(Payslip.net_pay).label("total_net"),
        )
        .join(Employee, Payslip.employee_id == Employee.id)
        .outerjoin(Department, Employee.department_id == Department.id)
        .where(Payslip.month == month, Payslip.year == year)
        .group_by(Department.name)
    )
    dept_rows = dept_result.all()

    return PayrollCostReport(
        month=month,
        year=year,
        total_employees=len(payslips),
        total_gross=round(sum(float(p.gross_salary) for p in payslips), 2),
        total_deductions=round(sum(float(p.total_deductions) for p in payslips), 2),
        total_net_pay=round(sum(float(p.net_pay) for p in payslips), 2),
        by_department=[
            {
                "department": r.dept_name or "Unassigned",
                "employee_count": r.emp_count,
                "total_gross": round(float(r.total_gross or 0), 2),
                "total_net": round(float(r.total_net or 0), 2),
            }
            for r in dept_rows
        ],
    )


# ── 5. Onboarding completion report ──────────────────────────────────────────

async def onboarding_report(db: AsyncSession) -> OnboardingReport:
    result = await db.execute(
        select(OnboardingRecord, Employee)
        .join(Employee, OnboardingRecord.employee_id == Employee.id)
    )
    rows = result.all()

    details = []
    for record, emp in rows:
        details.append({
            "employee_id": emp.id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "status": record.status,
            "started_at": record.started_at.isoformat() if record.started_at else None,
            "completed_at": record.completed_at.isoformat() if record.completed_at else None,
        })

    return OnboardingReport(
        total=len(rows),
        in_progress=sum(1 for r, _ in rows if r.status == "in_progress"),
        completed=sum(1 for r, _ in rows if r.status == "completed"),
        details=details,
    )