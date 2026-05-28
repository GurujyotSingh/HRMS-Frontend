"""
Leave Balance API — updated to match actual DB schema.
The leave_balances table references users.id (not employees.id).
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.role import RoleEnum

router = APIRouter(prefix="/leave-balance", tags=["Leave Balance"])


# Check what leave_balances columns actually exist in DB
class LeaveBalanceOut(BaseModel):
    id: Optional[str] = None
    employee_id: Optional[str] = None
    leave_type: Optional[str] = None
    total_days: Optional[int] = None
    used_days: Optional[int] = None
    remaining_days: Optional[int] = None

    model_config = {"from_attributes": True}


@router.get("/my", response_model=list[LeaveBalanceOut])
async def get_my_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """View current user's leave balances."""
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT * FROM leave_balances WHERE employee_id = :eid"),
        {"eid": current_user.id},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]


@router.get("/employee/{employee_id}", response_model=list[LeaveBalanceOut])
async def get_employee_balance(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: get a specific employee's leave balances."""
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT * FROM leave_balances WHERE employee_id = :eid"),
        {"eid": employee_id},
    )
    rows = result.mappings().all()
    return [dict(row) for row in rows]