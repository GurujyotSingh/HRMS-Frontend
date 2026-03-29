from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.onboarding import (
    OnboardingTemplateCreate, OnboardingTemplateRead,
    OnboardingTaskCreate, OnboardingRecordRead,
    OffboardingInitiate, OffboardingTaskCreate,
    ClearanceUpdate, OffboardingRecordRead,
)
from app.services import onboarding_service
from app.services.employee_service import get_employee_by_user_id

router = APIRouter(prefix="/onboarding", tags=["Onboarding & Offboarding"])


# ── Shared helper ─────────────────────────────────────────────────────────────

async def _resolve_employee(db, user_id):
    emp = await get_employee_by_user_id(db, user_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ═══════════════════════════════════════════════════════════════════════════════
# ONBOARDING
# ═══════════════════════════════════════════════════════════════════════════════

# ── HR: manage templates ──────────────────────────────────────────────────────

@router.get(
    "/templates",
    response_model=list[OnboardingTemplateRead],
    summary="HR: view all onboarding task templates",
)
async def get_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await onboarding_service.get_all_templates(db)


@router.post(
    "/templates",
    response_model=OnboardingTemplateRead,
    summary="HR: add a new onboarding task template",
    description="This task will be auto-added to every new employee's onboarding checklist.",
)
async def create_template(
    data: OnboardingTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await onboarding_service.create_template(db, data)


@router.delete(
    "/templates/{template_id}",
    summary="HR: deactivate an onboarding template",
    response_model=dict,
)
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        await onboarding_service.delete_template(db, template_id)
        return {"msg": "Template deactivated"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── HR: monitor all employees ─────────────────────────────────────────────────

@router.get(
    "/hr/all",
    response_model=list[OnboardingRecordRead],
    summary="HR: view onboarding progress for all employees",
)
async def hr_all_onboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await onboarding_service.get_all_onboarding_records(db)


@router.get(
    "/hr/employee/{employee_id}",
    response_model=OnboardingRecordRead,
    summary="HR: view a specific employee's onboarding",
)
async def hr_employee_onboarding(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    record = await onboarding_service.get_onboarding_by_employee(db, employee_id)
    if not record:
        raise HTTPException(status_code=404, detail="No onboarding record found")
    return record


@router.post(
    "/hr/employee/{employee_id}/tasks",
    response_model=OnboardingRecordRead,
    summary="HR: add a custom task to an employee's onboarding",
)
async def hr_add_task(
    employee_id: int,
    data: OnboardingTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await onboarding_service.hr_add_custom_onboarding_task(db, employee_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Employee: view & complete own tasks ───────────────────────────────────────

@router.get(
    "/my",
    response_model=OnboardingRecordRead,
    summary="View my onboarding checklist",
)
async def my_onboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    record = await onboarding_service.get_my_onboarding(db, employee.id)
    if not record:
        raise HTTPException(status_code=404, detail="No onboarding record found")
    return record


@router.post(
    "/my/tasks/{task_id}/complete",
    response_model=OnboardingRecordRead,
    summary="Mark an onboarding task as complete",
)
async def complete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await onboarding_service.complete_onboarding_task(db, task_id, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ═══════════════════════════════════════════════════════════════════════════════
# OFFBOARDING
# ═══════════════════════════════════════════════════════════════════════════════

@router.post(
    "/offboarding/initiate",
    response_model=OffboardingRecordRead,
    summary="HR: initiate offboarding for an employee",
    description="Creates offboarding record with default 7-task checklist automatically.",
)
async def initiate_offboarding(
    data: OffboardingInitiate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await onboarding_service.initiate_offboarding(db, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/offboarding/all",
    response_model=list[OffboardingRecordRead],
    summary="HR: view all offboarding records",
)
async def hr_all_offboarding(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await onboarding_service.get_all_offboarding_records(db)


@router.get(
    "/offboarding/employee/{employee_id}",
    response_model=OffboardingRecordRead,
    summary="HR: view a specific employee's offboarding",
)
async def hr_employee_offboarding(
    employee_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    record = await onboarding_service.get_offboarding_by_employee(db, employee_id)
    if not record:
        raise HTTPException(status_code=404, detail="No offboarding record found")
    return record


@router.post(
    "/offboarding/employee/{employee_id}/tasks",
    response_model=OffboardingRecordRead,
    summary="HR: add a custom task to an employee's offboarding",
)
async def hr_add_offboarding_task(
    employee_id: int,
    data: OffboardingTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await onboarding_service.hr_add_offboarding_task(db, employee_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/offboarding/{offboarding_record_id}/tasks/{task_id}/complete",
    response_model=OffboardingRecordRead,
    summary="HR: mark an offboarding task as complete",
)
async def complete_offboarding_task(
    offboarding_record_id: int,
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await onboarding_service.complete_offboarding_task(db, task_id, offboarding_record_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch(
    "/offboarding/employee/{employee_id}/clearance",
    response_model=OffboardingRecordRead,
    summary="HR: update clearance status",
    description='Set clearance_status to "pending", "cleared", or "hold"',
)
async def update_clearance(
    employee_id: int,
    data: ClearanceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await onboarding_service.update_clearance_status(db, employee_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))