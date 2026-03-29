from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.payroll import (
    SalaryStructureCreate, SalaryStructureRead,
    PayslipGenerate, PayslipRead, PayslipSummary,
)
from app.services import payroll_service
from app.services.employee_service import get_employee_by_user_id

router = APIRouter(prefix="/payroll", tags=["Payroll"])


async def _resolve_employee(db, user_id):
    emp = await get_employee_by_user_id(db, user_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ═══════════════════════════════════════════════════════════════════════════════
# SALARY STRUCTURE — HR only
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/salary-structure/{employee_id}",
    response_model=SalaryStructureRead,
    summary="HR: set or update salary structure for an employee",
    description=(
        "Creates salary structure if none exists, otherwise updates it. "
        "Must be set before generating a payslip."
    ),
)
async def set_salary_structure(
    employee_id: int,
    data: SalaryStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await payroll_service.set_salary_structure(db, employee_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/salary-structure/{employee_id}",
    response_model=SalaryStructureRead,
    summary="HR: view an employee's salary structure",
)
async def get_salary_structure(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    structure = await payroll_service.get_salary_structure(db, employee_id)
    if not structure:
        raise HTTPException(status_code=404, detail="No salary structure found")
    return structure


@router.get(
    "/my/salary-structure",
    response_model=SalaryStructureRead,
    summary="Employee: view own salary structure",
)
async def my_salary_structure(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    structure = await payroll_service.get_salary_structure(db, employee.id)
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not set yet")
    return structure


# ═══════════════════════════════════════════════════════════════════════════════
# PAYSLIPS — HR
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/payslips/generate",
    response_model=PayslipRead,
    summary="HR: generate a payslip for an employee",
    description=(
        "Auto-calculates from attendance + salary structure. "
        "Saved as **draft** — employee cannot see it until HR finalizes. "
        "Absent days cause per-day deduction. Approved leave days are paid."
    ),
)
async def generate_payslip(
    data: PayslipGenerate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await payroll_service.generate_payslip(db, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/payslips/{payslip_id}/finalize",
    response_model=PayslipRead,
    summary="HR: finalize a draft payslip (employee can view after this)",
)
async def finalize_payslip(
    payslip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await payroll_service.finalize_payslip(db, payslip_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/payslips/{payslip_id}/regenerate",
    response_model=PayslipRead,
    summary="HR: recalculate a draft payslip (use if attendance was updated)",
)
async def regenerate_payslip(
    payslip_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await payroll_service.regenerate_payslip(db, payslip_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/hr/payslips",
    response_model=list[PayslipRead],
    summary="HR: view all payslips (filter by month/year)",
)
async def hr_all_payslips(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await payroll_service.get_all_payslips_for_hr(db, month, year)


@router.get(
    "/hr/summary",
    response_model=PayslipSummary,
    summary="HR: payroll summary for a month — total gross, deductions, net pay",
)
async def hr_monthly_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await payroll_service.get_monthly_summary(db, month, year)


@router.get(
    "/hr/employee/{employee_id}/payslips",
    response_model=list[PayslipRead],
    summary="HR: view all payslips for a specific employee",
)
async def hr_employee_payslips(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await payroll_service.get_all_payslips_for_hr(db, employee_id=employee_id)


# ═══════════════════════════════════════════════════════════════════════════════
# PAYSLIPS — Employee (finalized only)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get(
    "/my/payslips",
    response_model=list[PayslipRead],
    summary="Employee: view own finalized payslips",
)
async def my_payslips(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await payroll_service.get_employee_payslips(db, employee.id)


@router.get(
    "/my/payslips/{month}/{year}",
    response_model=PayslipRead,
    summary="Employee: view payslip for a specific month",
)
async def my_payslip_by_month(
    month: int,
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    payslip = await payroll_service.get_payslip_by_month(db, employee.id, month, year)
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
    if payslip.status != "finalized":
        raise HTTPException(status_code=403, detail="Payslip not yet finalized by HR")
    return payslip