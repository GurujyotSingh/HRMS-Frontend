"""
Dashboard API — Real aggregated data from multiple tables.
Returns stats per role: employee count, pending leaves, today's attendance, etc.
"""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.attendance import Attendance
from app.db.models.leave_request import LeaveRequest
from app.db.models.onboarding import OnboardingEmployee
from app.db.models.payroll import Payslip
from app.db.models.performance import AppraisalCycle, PerformanceGoal
from app.db.models.announcement import Announcement

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Aggregated dashboard stats for all roles."""
    today = date.today()
    now = datetime.now(timezone.utc)

    # Total active employees
    emp_count = await db.scalar(
        select(func.count(User.id)).where(User.status == "ACTIVE")  # enum fix
    ) or 0

    # Pending leave requests
    pending_leaves = await db.scalar(
        select(func.count(LeaveRequest.id)).where(LeaveRequest.status == "PENDING")  # enum fix
    ) or 0

    # Today's attendance count
    today_present = await db.scalar(
        select(func.count(Attendance.id)).where(
            and_(Attendance.date == today, Attendance.status == "PRESENT")  # enum fix
        )
    ) or 0

    # Onboarding in progress
    onboarding_in_progress = await db.scalar(
        select(func.count(OnboardingEmployee.id)).where(
            OnboardingEmployee.status == "IN_PROGRESS"  # enum fix
        )
    ) or 0

    # Draft payslips this month
    draft_payslips = await db.scalar(
        select(func.count(Payslip.id)).where(
            and_(
                Payslip.month == today.month,
                Payslip.year == today.year,
                Payslip.status == "DRAFT",  # enum fix
            )
        )
    ) or 0

    # Active appraisal cycle
    active_cycle = await db.scalar(
        select(AppraisalCycle).where(AppraisalCycle.status == "ACTIVE").limit(1)  # enum fix
    )

    # Pending performance reviews
    pending_reviews = 0
    if active_cycle:
        pending_reviews = await db.scalar(
            select(func.count(PerformanceGoal.id)).where(
                PerformanceGoal.cycle_id == active_cycle.id,
                PerformanceGoal.status == "SUBMITTED",  # enum fix
            )
        ) or 0

    # Latest 5 announcements
    ann_result = await db.execute(
        select(Announcement.id, Announcement.title, Announcement.priority, Announcement.published_at)
        .where((Announcement.expires_at == None) | (Announcement.expires_at > now))
        .order_by(Announcement.published_at.desc())
        .limit(5)
    )
    recent_announcements = [
        {"id": row[0], "title": row[1], "priority": row[2], "published_at": row[3].isoformat()}
        for row in ann_result.fetchall()
    ]

    return {
        "total_employees": emp_count,
        "pending_leaves": pending_leaves,
        "today_present": today_present,
        "onboarding_in_progress": onboarding_in_progress,
        "draft_payslips_this_month": draft_payslips,
        "pending_performance_reviews": pending_reviews,
        "active_appraisal_cycle": active_cycle.title if active_cycle else None,
        "recent_announcements": recent_announcements,
        "as_of": now.isoformat(),
    }


@router.get("/employee")
async def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Personal dashboard for an employee."""
    today = date.today()

    # My leave requests this year
    my_leaves = await db.scalar(
        select(func.count(LeaveRequest.id)).where(
            LeaveRequest.employee_id == current_user.id
        )
    ) or 0

    # My pending leaves
    my_pending = await db.scalar(
        select(func.count(LeaveRequest.id)).where(
            LeaveRequest.employee_id == current_user.id,
            LeaveRequest.status == "PENDING",  # enum fix
        )
    ) or 0

    # My latest payslip
    payslip_result = await db.execute(
        select(Payslip.month, Payslip.year, Payslip.net_salary, Payslip.status)
        .where(Payslip.employee_id == current_user.id)
        .order_by(Payslip.year.desc(), Payslip.month.desc())
        .limit(1)
    )
    latest_payslip = payslip_result.fetchone()

    # Today's attendance
    att_result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == current_user.id,
            Attendance.date == today,
        )
    )
    today_att = att_result.scalar_one_or_none()

    return {
        "employee_id": current_user.employee_id,
        "full_name": f"{current_user.first_name} {current_user.last_name}",
        "role": current_user.role,
        "designation": current_user.designation,
        "total_leave_requests": my_leaves,
        "pending_leave_requests": my_pending,
        "latest_payslip": {
            "month": latest_payslip[0],
            "year": latest_payslip[1],
            "net_salary": float(latest_payslip[2]),
            "status": latest_payslip[3],
        } if latest_payslip else None,
        "today_attendance": {
            "status": today_att.status if today_att else "not_marked",
            "check_in": today_att.check_in.isoformat() if today_att and today_att.check_in else None,
            "check_out": today_att.check_out.isoformat() if today_att and today_att.check_out else None,
        } if today_att else {"status": "not_marked"},
    }
