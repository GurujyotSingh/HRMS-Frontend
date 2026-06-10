from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.payroll import (
    PayrollRunCreate, PayrollRunUpdate, PayrollRunRead, PayrollRunPaginatedOut, PayrollActionRequest, PayslipRead
)
from app.services import payroll_service

router = APIRouter(prefix="/payroll", tags=["Payroll"])


@router.post("", response_model=PayrollRunRead)
async def create_payroll(
    request: Request,
    data: PayrollRunCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN)),
):
    try:
        return await payroll_service.create_payroll(db, data, current_user, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=PayrollRunPaginatedOut)
async def list_payrolls(
    employee_id: Optional[str] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce access
    is_privileged = current_user.role and current_user.role.lower() in ["hr", "hr_manager", "hr_staff", "admin", "super_admin", "finance"]
    if not is_privileged:
        employee_id = current_user.id
        
    items, total = await payroll_service.list_payrolls(db, skip, limit, employee_id, month, year, status)
    return {"items": items, "total": total}


@router.get("/employee/{emp_id}", response_model=PayrollRunPaginatedOut)
async def list_employee_payrolls(
    emp_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if emp_id == "me":
        emp_id = current_user.id

    is_privileged = current_user.role and current_user.role.lower() in ["hr", "hr_manager", "hr_staff", "admin", "super_admin", "finance"]
    if not is_privileged and current_user.id != emp_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    items, total = await payroll_service.list_payrolls(db, skip, limit, emp_id)
    return {"items": items, "total": total}


@router.get("/{id}", response_model=PayrollRunRead)
async def get_payroll(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    run = await payroll_service.get_payroll(db, id)
    if not run:
        raise HTTPException(status_code=404, detail="Payroll not found")
        
    is_privileged = current_user.role and current_user.role.lower() in ["hr", "admin", "super_admin", "finance"]
    if not is_privileged and run.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return run


@router.put("/{id}", response_model=PayrollRunRead)
async def update_payroll(
    request: Request,
    id: str,
    data: PayrollRunUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN)),
):
    run = await payroll_service.update_payroll(db, id, data, current_user, request)
    if not run:
        raise HTTPException(status_code=404, detail="Payroll not found")
    return run


@router.post("/{id}/submit", response_model=PayrollRunRead)
async def submit_payroll(
    request: Request,
    id: str,
    data: PayrollActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN)),
):
    try:
        return await payroll_service.submit_payroll(db, id, data.remarks, current_user, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/approve", response_model=PayrollRunRead)
async def approve_payroll(
    request: Request,
    id: str,
    data: PayrollActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN, RoleEnum.DEPARTMENT_HEAD, RoleEnum.ACCOUNTANT, "finance")),
):
    try:
        return await payroll_service.approve_payroll(db, id, data.remarks, current_user, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/reject", response_model=PayrollRunRead)
async def reject_payroll(
    request: Request,
    id: str,
    data: PayrollActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN, RoleEnum.DEPARTMENT_HEAD, RoleEnum.ACCOUNTANT, "finance")),
):
    return await payroll_service.reject_payroll(db, id, data.remarks, current_user, request)


@router.post("/{id}/mark-paid", response_model=PayrollRunRead)
async def mark_paid_payroll(
    request: Request,
    id: str,
    data: PayrollActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ACCOUNTANT, "finance", RoleEnum.ADMIN)),
):
    try:
        return await payroll_service.mark_paid(db, id, data.remarks, current_user, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{id}/generate-payslip", response_model=PayslipRead)
async def generate_payslip(
    request: Request,
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, "hr_manager", "hr_staff", RoleEnum.ADMIN)),
):
    run = await payroll_service.get_payroll(db, id)
    if not run or run.status != "Paid":
        raise HTTPException(status_code=400, detail="Cannot generate payslip unless Paid")
    return await payroll_service.generate_payslip(db, id, current_user, request)


@router.get("/{id}/download-payslip")
async def download_payslip(
    request: Request,
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.db.models.payroll import Payslip
    result = await db.execute(select(Payslip).where(Payslip.payroll_run_id == id))
    payslip = result.scalar_one_or_none()
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip not found")
        
    run = await payroll_service.get_payroll(db, id)
    is_privileged = current_user.role and current_user.role.lower() in ["hr", "admin", "super_admin", "finance"]
    if not is_privileged and run.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    payslip.downloaded_count += 1
    db.add(payslip)
    
    from app.services.audit_service import audit
    await audit(db, "PAYSLIP_DOWNLOADED", user_id=current_user.id, user_email=current_user.email, resource="payslip", resource_id=payslip.id, detail="Payslip Downloaded", request=request)
    await db.commit()
    
    return {"url": payslip.pdf_path, "message": "Payslip ready for download"}
