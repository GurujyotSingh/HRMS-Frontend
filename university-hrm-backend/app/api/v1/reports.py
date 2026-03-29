from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.performance import (
    DeptRoleCount, LeaveStatsReport,
    AttendanceSummaryReport, PayrollCostReport, OnboardingReport,
)
from app.services import reports_service

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get(
    "/employees/by-dept-role",
    response_model=list[DeptRoleCount],
    summary="HR/Admin: employee count grouped by department and role",
)
async def emp_count_by_dept_role(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await reports_service.employee_count_by_dept_role(db)


@router.get(
    "/leaves/stats",
    response_model=LeaveStatsReport,
    summary="HR: leave statistics — total, pending, approved, rejected",
)
async def leave_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await reports_service.leave_stats(db)


@router.get(
    "/attendance/summary",
    response_model=list[AttendanceSummaryReport],
    summary="HR: attendance summary for all employees in a given month",
)
async def attendance_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await reports_service.attendance_summary(db, month, year)


@router.get(
    "/payroll/cost",
    response_model=PayrollCostReport,
    summary="HR: payroll cost report by department for a given month",
)
async def payroll_cost(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await reports_service.payroll_cost_report(db, month, year)


@router.get(
    "/onboarding/completion",
    response_model=OnboardingReport,
    summary="HR: onboarding completion status across all employees",
)
async def onboarding_completion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await reports_service.onboarding_report(db)