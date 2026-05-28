"""
Leaves API — updated to use the actual `leave_requests` table.
DB columns: from_date / to_date (not start_date / end_date), total_days,
reviewed_by_id, remarks, applied_at, updated_at.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.leave_request import LeaveRequest
from app.db.models.user import User
from app.db.models.role import RoleEnum

router = APIRouter(prefix="/leaves", tags=["Leaves"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LeaveApply(BaseModel):
    leave_type: str               # casual | sick | earned | unpaid
    from_date: datetime
    to_date: datetime
    total_days: int
    reason: str
    attachment_url: Optional[str] = None


class LeaveProcess(BaseModel):
    action: str                   # approve | reject
    remarks: Optional[str] = None


class LeaveOut(BaseModel):
    id: str
    employee_id: str
    leave_type: Optional[str] = None
    from_date: datetime
    to_date: datetime
    total_days: int
    reason: str
    attachment_url: Optional[str] = None
    status: Optional[str] = None
    reviewed_by_id: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    remarks: Optional[str] = None
    applied_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Helper ────────────────────────────────────────────────────────────────────

async def _get_leave_or_404(db: AsyncSession, leave_id: str) -> LeaveRequest:
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == leave_id))
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    return leave


# ── Employee Endpoints ────────────────────────────────────────────────────────

@router.get("/my", response_model=list[LeaveOut])
async def get_my_leaves(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """View current user's own leave history."""
    result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.employee_id == current_user.id)
        .order_by(LeaveRequest.applied_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/apply", response_model=LeaveOut)
async def apply_leave(
    data: LeaveApply,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply for leave."""
    now = datetime.now(timezone.utc)
    leave = LeaveRequest(
        id=str(uuid.uuid4()),
        employee_id=current_user.id,
        leave_type=data.leave_type,
        from_date=data.from_date,
        to_date=data.to_date,
        total_days=data.total_days,
        reason=data.reason,
        attachment_url=data.attachment_url,
        status="pending",
        applied_at=now,
        updated_at=now,
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)
    return leave


@router.post("/my/{leave_id}/cancel", response_model=LeaveOut)
async def cancel_my_leave(
    leave_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a pending leave request."""
    leave = await _get_leave_or_404(db, leave_id)
    if leave.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your leave request")
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending leaves can be cancelled")
    leave.status = "cancelled"
    leave.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(leave)
    return leave


# ── HOD Endpoints ─────────────────────────────────────────────────────────────

@router.get("/hod/pending", response_model=list[LeaveOut])
async def hod_pending_leaves(
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """HOD: view pending leaves in their department."""
    result = await db.execute(
        select(LeaveRequest)
        .join(User, User.id == LeaveRequest.employee_id)
        .where(
            User.department_id == current_user.department_id,
            LeaveRequest.status == "pending",
            LeaveRequest.employee_id != current_user.id,
        )
        .order_by(LeaveRequest.applied_at)
    )
    return result.scalars().all()


@router.post("/hod/{leave_id}/approve", response_model=LeaveOut)
async def hod_approve(
    leave_id: str,
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """HOD: approve a leave."""
    leave = await _get_leave_or_404(db, leave_id)
    leave.status = "approved"
    leave.reviewed_by_id = current_user.id
    leave.reviewed_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(leave)
    return leave


@router.post("/hod/{leave_id}/reject", response_model=LeaveOut)
async def hod_reject(
    leave_id: str,
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """HOD: reject a leave."""
    leave = await _get_leave_or_404(db, leave_id)
    leave.status = "rejected"
    leave.reviewed_by_id = current_user.id
    leave.reviewed_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(leave)
    return leave


# ── HR Endpoints ──────────────────────────────────────────────────────────────

@router.get("/hr/all", response_model=list[LeaveOut])
async def hr_all_leaves(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: view all leave requests."""
    stmt = (
        select(LeaveRequest)
        .order_by(LeaveRequest.applied_at.desc())
        .offset(skip).limit(limit)
    )
    if status:
        stmt = stmt.where(LeaveRequest.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/hr/queue", response_model=list[LeaveOut])
async def hr_queue(
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR: view leaves awaiting HR action (pending or hod_approved)."""
    result = await db.execute(
        select(LeaveRequest)
        .where(LeaveRequest.status.in_(["pending", "approved"]))
        .order_by(LeaveRequest.applied_at)
    )
    return result.scalars().all()


@router.post("/hr/{leave_id}/process", response_model=LeaveOut)
async def hr_process_leave(
    leave_id: str,
    body: LeaveProcess,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: approve or reject a leave."""
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
    leave = await _get_leave_or_404(db, leave_id)
    leave.status = "approved" if body.action == "approve" else "rejected"
    leave.reviewed_by_id = current_user.id
    leave.reviewed_at = datetime.now(timezone.utc)
    leave.updated_at = datetime.now(timezone.utc)
    if body.remarks:
        leave.remarks = body.remarks
    await db.commit()
    await db.refresh(leave)
    return leave


@router.patch("/hr/{leave_id}", response_model=LeaveOut)
async def hr_update_leave(
    leave_id: str,
    body: dict,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: edit a leave record."""
    leave = await _get_leave_or_404(db, leave_id)
    for field, value in body.items():
        if hasattr(leave, field):
            setattr(leave, field, value)
    leave.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(leave)
    return leave