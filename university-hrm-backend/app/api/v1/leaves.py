from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.leave import LeaveCreate, LeaveApproveHR, LeaveRead
from app.services import leave_service
from app.services.employee_service import get_employee_by_user_id

router = APIRouter(prefix="/leaves", tags=["Leaves"])


# ── Shared helper ─────────────────────────────────────────────────────────────

async def _resolve_employee(db: AsyncSession, user_id: int):
    employee = await get_employee_by_user_id(db, user_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found for this user")
    return employee


def _is_hod(user: User) -> bool:
    return user.role.name == RoleEnum.DEPARTMENT_HEAD


# ── Employee routes ───────────────────────────────────────────────────────────

@router.post(
    "/apply",
    response_model=LeaveRead,
    summary="Apply for leave",
    description="Any employee (including HOD) can apply. HOD's own leaves skip HOD approval and go straight to HR.",
)
async def apply_leave(
    leave_in: LeaveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await leave_service.apply_leave(db, employee, leave_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/my",
    response_model=list[LeaveRead],
    summary="View my leave history",
)
async def get_my_leaves(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await leave_service.get_own_leaves(db, employee.id)


@router.post(
    "/my/{leave_id}/cancel",
    response_model=LeaveRead,
    summary="Cancel a pending leave request",
)
async def cancel_my_leave(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await leave_service.cancel_leave(db, leave_id, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── HOD routes ────────────────────────────────────────────────────────────────

@router.get(
    "/hod/pending",
    response_model=list[LeaveRead],
    summary="HOD: view pending leaves in department (excludes own)",
)
async def hod_pending_leaves(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    employee = await _resolve_employee(db, current_user.id)
    if not employee.department_id:
        raise HTTPException(status_code=400, detail="You have no department assigned")
    return await leave_service.get_pending_leaves_for_hod(db, employee.department_id, employee.id)


@router.post(
    "/hod/{leave_id}/approve",
    response_model=LeaveRead,
    summary="HOD: approve a department employee's leave",
)
async def hod_approve(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    employee = await _resolve_employee(db, current_user.id)
    if not employee.department_id:
        raise HTTPException(status_code=400, detail="You have no department assigned")
    try:
        return await leave_service.approve_by_hod(db, leave_id, current_user.id, employee.department_id, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/hod/{leave_id}/reject",
    response_model=LeaveRead,
    summary="HOD: reject a department employee's leave",
)
async def hod_reject(
    leave_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    employee = await _resolve_employee(db, current_user.id)
    if not employee.department_id:
        raise HTTPException(status_code=400, detail="You have no department assigned")
    try:
        return await leave_service.reject_by_hod(db, leave_id, current_user.id, employee.department_id, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── HR routes ─────────────────────────────────────────────────────────────────

@router.get(
    "/hr/all",
    response_model=list[LeaveRead],
    summary="HR: view all leave requests across all departments",
)
async def hr_all_leaves(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await leave_service.get_all_leaves_for_hr(db)


@router.get(
    "/hr/queue",
    response_model=list[LeaveRead],
    summary="HR: view action queue (HOD-approved + HOD's own pending)",
)
async def hr_action_queue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await leave_service.get_hr_action_queue(db)


@router.post(
    "/hr/{leave_id}/process",
    response_model=LeaveRead,
    summary='HR: final approve or reject — body: {"action": "approve" | "reject"}',
    description=(
        "**approve**: leave must be APPROVED_BY_HOD (or PENDING if applicant is a HOD). "
        "Balance is deducted automatically on approval.\n\n"
        "**reject**: works at PENDING or APPROVED_BY_HOD stage."
    ),
)
async def hr_process_leave(
    leave_id: int,
    body: LeaveApproveHR,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await leave_service.process_by_hr(db, leave_id, current_user.id, body.action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.get(
    "/admin/queue",
    response_model=list[LeaveRead],
    summary="Admin: view pending leaves from HR users",
)
async def admin_hr_queue(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    return await leave_service.get_pending_leaves_for_admin(db)


@router.post(
    "/admin/{leave_id}/process",
    response_model=LeaveRead,
    summary="Admin: approve or reject HR leave",
)
async def admin_process_leave(
    leave_id: int,
    body: LeaveApproveHR,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
):
    try:
        return await leave_service.process_by_admin(db, leave_id, current_user.id, body.action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))