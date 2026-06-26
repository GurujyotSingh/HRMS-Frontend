"""
Onboarding API — updated for actual DB schema.
- Table is onboarding_employees (not onboarding_records)
- No OnboardingTemplate table exists in DB
- UUID string PKs
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.models.employment import UserEmployment
from app.db.session import get_db
from app.services import onboarding_service

router = APIRouter(prefix="/onboarding", tags=["Onboarding & Offboarding"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    assigned_to: str = "EMPLOYEE"
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OnboardingOut(BaseModel):
    id: str
    employee_id: str
    start_date: datetime
    expected_completion_date: datetime
    completed_at: Optional[datetime] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tasks: list[TaskOut] = []

    model_config = {"from_attributes": True}


class EmployeeSummary(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str
    model_config = {"from_attributes": True}

class OffboardingOut(BaseModel):
    id: str
    employee_id: str
    initiated_by_id: str
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None
    status: str
    clearance_status: str
    initiated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    tasks: list[TaskOut] = []
    employee: Optional[EmployeeSummary] = None

    model_config = {"from_attributes": True}


class AddTaskBody(BaseModel):
    title: str
    description: Optional[str] = None


class OffboardingTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None

class OffboardingInitiate(BaseModel):
    employee_id: str
    reason: Optional[str] = None
    last_working_date: Optional[datetime] = None
    tasks: Optional[list[OffboardingTaskCreate]] = None

class OffboardingTemplateResponse(BaseModel):
    tasks: list[OffboardingTaskCreate]

class OffboardingAnalysisResponse(BaseModel):
    sentiment: str
    primary_reason: str
    secondary_reason: Optional[str] = None
    risk_level: str
    confidence: int
    summary: str
    
    model_config = {"from_attributes": True}

class ClearanceUpdate(BaseModel):
    clearance_status: str   # pending | cleared | hold


# ── Employee: view own onboarding ────────────────────────────────────────────

@router.get("/my", response_model=Optional[OnboardingOut])
async def my_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """View my onboarding checklist."""
    record = await onboarding_service.get_onboarding_by_employee(db, current_user.id)
    return record


@router.post("/my/tasks/{task_id}/complete", response_model=TaskOut)
async def complete_my_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark an onboarding task as complete."""
    try:
        from sqlalchemy import select
        from app.db.models.onboarding import OnboardingTask
        task = await db.scalar(select(OnboardingTask).where(OnboardingTask.id == task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        if task.assigned_to != "EMPLOYEE":
            raise HTTPException(status_code=403, detail="You can only complete EMPLOYEE tasks.")

        task_out = await onboarding_service.complete_onboarding_task(db, task_id, current_user.id)
        await onboarding_service.check_and_complete_onboarding(db, task.onboarding_record_id)
        return task_out
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/hr/tasks/{task_id}/complete", response_model=TaskOut)
async def complete_hr_task(
    task_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Mark any onboarding task as complete."""
    try:
        from sqlalchemy import select
        from app.db.models.onboarding import OnboardingTask
        task = await db.scalar(select(OnboardingTask).where(OnboardingTask.id == task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        task_out = await onboarding_service.complete_onboarding_task(db, task_id, current_user.id)
        await onboarding_service.check_and_complete_onboarding(db, task.onboarding_record_id)
        return task_out
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── HR: monitor all employees ─────────────────────────────────────────────────

@router.get("/hr/all", response_model=list[OnboardingOut])
async def hr_all_onboarding(
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: view all employee onboarding records."""
    return await onboarding_service.get_all_onboarding_records(db)


@router.get("/hr/employee/{employee_id}", response_model=OnboardingOut)
async def hr_employee_onboarding(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: view a specific employee's onboarding."""
    record = await onboarding_service.get_onboarding_by_employee(db, employee_id)
    if not record:
        raise HTTPException(status_code=404, detail="No onboarding record found")
    return record


@router.post("/hr/employee/{employee_id}", response_model=OnboardingOut)
async def hr_create_onboarding(
    employee_id: str,
    body: Optional[dict] = None,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: create onboarding record for an employee."""
    try:
        return await onboarding_service.create_onboarding_for_employee(db, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/hr/employee/{employee_id}/tasks", response_model=OnboardingOut)
async def hr_add_task(
    employee_id: str,
    body: AddTaskBody,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: add a custom task to an employee's onboarding."""
    record = await onboarding_service.get_onboarding_by_employee(db, employee_id)
    if not record:
        raise HTTPException(status_code=404, detail="No onboarding record found")
    await onboarding_service.add_onboarding_task(db, record.id, body.title, body.description)
    return await onboarding_service.get_onboarding_by_employee(db, employee_id)


# ── Offboarding ───────────────────────────────────────────────────────────────

@router.get("/offboarding/templates/{employee_id}", response_model=OffboardingTemplateResponse)
async def get_offboarding_template_preview(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: get the deterministic template tasks for an employee before initiating."""
    emp_result = await db.execute(
        select(User).options(selectinload(User.employment).selectinload(UserEmployment.department)).where(User.id == employee_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    dept_name = employee.employment.department.name if employee.employment and getattr(employee.employment, 'department', None) else ""
    tasks = onboarding_service.get_offboarding_template(employee.role, dept_name)
    
    return {"tasks": [{"title": t[0], "description": t[1]} for t in tasks]}


@router.post("/offboarding/initiate", response_model=OffboardingOut)
async def initiate_offboarding(
    data: OffboardingInitiate,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: initiate offboarding for an employee."""
    try:
        return await onboarding_service.initiate_offboarding(
            db, data.employee_id, current_user.id, data.reason, data.last_working_date, data.tasks
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/offboarding/all", response_model=list[OffboardingOut])
async def hr_all_offboarding(
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: list all offboarding records."""
    return await onboarding_service.get_all_offboarding_records(db)


@router.get("/offboarding/employee/{employee_id}", response_model=OffboardingOut)
async def hr_employee_offboarding(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: view an employee's offboarding."""
    record = await onboarding_service.get_offboarding_by_employee(db, employee_id)
    if not record:
        raise HTTPException(status_code=404, detail="No offboarding record found")
    return record

@router.post("/offboarding/{record_id}/analyze", response_model=OffboardingAnalysisResponse)
async def analyze_offboarding(
    record_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: analyze exit interview notes for an offboarding record."""
    try:
        return await onboarding_service.analyze_exit_interview(db, record_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
@router.post("/offboarding/{record_id}/tasks/{task_id}/complete", response_model=OffboardingOut)
async def complete_offboarding_task(
    record_id: str,
    task_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: complete an offboarding task."""
    try:
        return await onboarding_service.complete_offboarding_task(db, task_id, record_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/offboarding/employee/{employee_id}/clearance", response_model=OffboardingOut)
async def update_clearance(
    employee_id: str,
    data: ClearanceUpdate,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: update clearance status."""
    try:
        return await onboarding_service.update_clearance_status(db, employee_id, data.clearance_status)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))