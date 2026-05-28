"""
Reports service — updated for actual DB schema.
- Uses users table directly (no separate employees table)
- Uses leave_requests table (not leave)
- Uses onboarding_employees table (not onboarding_records)
- net_salary (not net_pay) in payslips
- role stored as string on users table
"""
import calendar
import datetime

from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.db.models.department import Department
from app.db.models.leave_request import LeaveRequest
from app.db.models.attendance import Attendance
from app.db.models.payroll import Payslip
from app.db.models.onboarding import OnboardingEmployee


# ── 1. Employee count by dept/role ────────────────────────────────────────────

async def employee_count_by_dept_role(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(
            Department.name.label("department"),
            User.role.label("role"),
            func.count(User.id).label("count"),
        )
        .outerjoin(Department, User.department_id == Department.id)
        .where(User.status == "active")
        .group_by(Department.name, User.role)
        .order_by(Department.name, User.role)
    )
    rows = result.all()
    return [
        {"department": r.department or "Unassigned", "role": r.role or "employee", "count": r.count}
        for r in rows
    ]


# ── 2. Leave stats ────────────────────────────────────────────────────────────

async def leave_stats(db: AsyncSession) -> dict:
    result = await db.execute(select(LeaveRequest))
    all_leaves = result.scalars().all()
    return {
        "total": len(all_leaves),
        "pending": sum(1 for l in all_leaves if l.status == "pending"),
        "approved": sum(1 for l in all_leaves if l.status == "approved"),
        "rejected": sum(1 for l in all_leaves if l.status == "rejected"),
        "cancelled": sum(1 for l in all_leaves if l.status == "cancelled"),
    }


# ── 3. Attendance summary (all employees, given month/year) ───────────────────

async def attendance_summary(db: AsyncSession, month: int, year: int) -> list[dict]:
    result = await db.execute(
        select(
            User.id,
            User.first_name,
            User.last_name,
            func.count(Attendance.id).filter(Attendance.status == "present").label("days_present"),
            func.count(Attendance.id).filter(Attendance.is_late == True).label("days_late"),
            func.coalesce(func.sum(Attendance.total_hours), 0).label("total_hours"),
        )
        .outerjoin(
            Attendance,
            (Attendance.employee_id == User.id) &
            (extract("month", Attendance.date) == month) &
            (extract("year", Attendance.date) == year)
        )
        .where(User.status == "active")
        .group_by(User.id, User.first_name, User.last_name)
        .order_by(User.first_name)
    )
    rows = result.all()
    working_days = sum(
        1 for d in range(1, calendar.monthrange(year, month)[1] + 1)
        if calendar.weekday(year, month, d) < 5
    )
    return [
        {
            "employee_id": r.id,
            "employee_name": f"{r.first_name} {r.last_name}",
            "days_present": r.days_present or 0,
            "days_absent": max(working_days - (r.days_present or 0), 0),
            "days_late": r.days_late or 0,
            "total_hours": float(r.total_hours or 0),
        }
        for r in rows
    ]


# ── 4. Payroll cost report ────────────────────────────────────────────────────

async def payroll_cost_report(db: AsyncSession, month: int, year: int) -> dict:
    result = await db.execute(
        select(Payslip).where(Payslip.month == month, Payslip.year == year)
    )
    payslips = result.scalars().all()

    dept_result = await db.execute(
        select(
            Department.name.label("dept_name"),
            func.count(Payslip.id).label("emp_count"),
            func.sum(Payslip.gross_salary).label("total_gross"),
            func.sum(Payslip.net_salary).label("total_net"),    # net_salary not net_pay
        )
        .join(User, Payslip.employee_id == User.id)
        .outerjoin(Department, User.department_id == Department.id)
        .where(Payslip.month == month, Payslip.year == year)
        .group_by(Department.name)
    )
    dept_rows = dept_result.all()

    return {
        "month": month,
        "year": year,
        "total_employees": len(payslips),
        "total_gross": round(sum(float(p.gross_salary) for p in payslips), 2),
        "total_deductions": round(sum(float(p.total_deductions) for p in payslips), 2),
        "total_net_pay": round(sum(float(p.net_salary) for p in payslips), 2),
        "by_department": [
            {
                "department": r.dept_name or "Unassigned",
                "employee_count": r.emp_count,
                "total_gross": round(float(r.total_gross or 0), 2),
                "total_net": round(float(r.total_net or 0), 2),
            }
            for r in dept_rows
        ],
    }


# ── 5. Weekly attendance report ───────────────────────────────────────────────

async def attendance_weekly(db: AsyncSession) -> list[dict]:
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    weekly_data = []
    for i in range(5):
        day = start_of_week + datetime.timedelta(days=i)
        result = await db.execute(
            select(
                func.count(Attendance.id).filter(Attendance.status == "present").label("present"),
                func.count(Attendance.id).filter(Attendance.is_late == True).label("late"),
            ).where(Attendance.date == day)
        )
        row = result.first()
        weekly_data.append({
            "name": day.strftime("%a"),
            "present": row.present or 0,
            "late": row.late or 0,
        })
    return weekly_data


# ── 6. Onboarding completion report ──────────────────────────────────────────

async def onboarding_report(db: AsyncSession) -> dict:
    result = await db.execute(
        select(OnboardingEmployee, User)
        .join(User, OnboardingEmployee.employee_id == User.id)
    )
    rows = result.all()
    details = [
        {
            "employee_id": emp.id,
            "employee_name": f"{emp.first_name} {emp.last_name}",
            "status": record.status,
            "start_date": record.start_date.isoformat() if record.start_date else None,
            "completed_at": record.completed_at.isoformat() if record.completed_at else None,
        }
        for record, emp in rows
    ]
    return {
        "total": len(rows),
        "in_progress": sum(1 for r, _ in rows if r.status == "in_progress"),
        "completed": sum(1 for r, _ in rows if r.status == "completed"),
        "details": details,
    }