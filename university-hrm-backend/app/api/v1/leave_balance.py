from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.models.enums import LeaveType
from app.db.session import get_db
from app.schemas.leave_balance import (
    LeaveBalanceRead, LeaveBalanceUpdate,
    LeavePolicyRead, LeavePolicyCreate, LeavePolicyUpdate,
)
from app.services import leave_balance_service
from app.services.employee_service import get_employee_by_user_id, get_employee_by_id

router = APIRouter(prefix="/leave-balances", tags=["Leave Balances"])


# ── Employee: view own balance ────────────────────────────────────────────────

@router.get(
    "/my",
    response_model=list[LeaveBalanceRead],
    summary="View my leave balances",
)
async def get_my_balances(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await get_employee_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return await leave_balance_service.get_balances_for_employee(db, employee.id)


# ── HR: manage employee balances ──────────────────────────────────────────────

@router.get(
    "/employee/{employee_id}",
    response_model=list[LeaveBalanceRead],
    summary="HR: view a specific employee's leave balances",
)
async def hr_get_employee_balances(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    balances = await leave_balance_service.get_balances_for_employee(db, employee_id)
    if not balances:
        raise HTTPException(status_code=404, detail="No balance records found for this employee")
    return balances


@router.patch(
    "/employee/{employee_id}/{leave_type}",
    response_model=LeaveBalanceRead,
    summary="HR: override a specific employee's quota for one leave type",
)
async def hr_override_balance(
    employee_id: int,
    leave_type: LeaveType,
    body: LeaveBalanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await leave_balance_service.hr_override_employee_balance(
            db, employee_id, leave_type, body.total_days
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── HR: manage global policies ────────────────────────────────────────────────

@router.get(
    "/policies",
    response_model=list[LeavePolicyRead],
    summary="HR: view all leave policies",
)
async def get_policies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await leave_balance_service.get_all_policies(db)


@router.post(
    "/policies",
    response_model=LeavePolicyRead,
    summary="HR: create or update a leave policy (role + leave type → default days)",
)
async def upsert_policy(
    body: LeavePolicyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await leave_balance_service.upsert_policy(
        db, body.role_name, body.leave_type, body.default_days
    )