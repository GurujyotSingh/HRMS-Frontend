from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.onboarding import (
    OnboardingTemplate, OnboardingRecord, OnboardingTask,
    OffboardingRecord, OffboardingTask,
)
from app.schemas.onboarding import (
    OnboardingTemplateCreate, OnboardingTaskCreate,
    OffboardingInitiate, OffboardingTaskCreate, ClearanceUpdate,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _fetch_onboarding(db: AsyncSession, record_id: int) -> OnboardingRecord:
    result = await db.execute(
        select(OnboardingRecord)
        .options(selectinload(OnboardingRecord.tasks))
        .where(OnboardingRecord.id == record_id)
    )
    return result.scalar_one()


async def _fetch_offboarding(db: AsyncSession, record_id: int) -> OffboardingRecord:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .where(OffboardingRecord.id == record_id)
    )
    return result.scalar_one()


def _notify_completion(employee_id: int, record_type: str) -> None:
    """
    Notification stub — replace with real email later.
    e.g. send_email(employee.email, f"{record_type} completed")
    """
    print(f"[NOTIFY] Employee {employee_id}: {record_type} all tasks completed ✓")


# ── Onboarding Templates (HR manages) ────────────────────────────────────────

async def get_all_templates(db: AsyncSession) -> list[OnboardingTemplate]:
    result = await db.execute(
        select(OnboardingTemplate).where(OnboardingTemplate.is_active == True)
    )
    return result.scalars().all()


async def create_template(db: AsyncSession, data: OnboardingTemplateCreate) -> OnboardingTemplate:
    template = OnboardingTemplate(title=data.title, description=data.description)
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


async def delete_template(db: AsyncSession, template_id: int) -> None:
    result = await db.execute(select(OnboardingTemplate).where(OnboardingTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise ValueError("Template not found")
    template.is_active = False   # soft delete
    await db.commit()


# ── Onboarding: auto-seed when employee is created ───────────────────────────

async def seed_onboarding_for_employee(db: AsyncSession, employee_id: int) -> OnboardingRecord:
    """
    Called automatically when a new employee is created.
    Creates OnboardingRecord + one OnboardingTask per active template.
    """
    # Check if already exists
    result = await db.execute(
        select(OnboardingRecord).where(OnboardingRecord.employee_id == employee_id)
    )
    if result.scalar_one_or_none():
        raise ValueError("Onboarding already exists for this employee")

    record = OnboardingRecord(
        employee_id=employee_id,
        status="in_progress",
        started_at=_utcnow(),
    )
    db.add(record)
    await db.flush()   # get record.id before adding tasks

    # Seed tasks from active templates
    templates_result = await db.execute(
        select(OnboardingTemplate).where(OnboardingTemplate.is_active == True)
    )
    templates = templates_result.scalars().all()

    for t in templates:
        task = OnboardingTask(
            onboarding_record_id=record.id,
            title=t.title,
            description=t.description,
        )
        db.add(task)

    await db.commit()
    return await _fetch_onboarding(db, record.id)


# ── Onboarding: employee completes tasks ─────────────────────────────────────

async def complete_onboarding_task(
    db: AsyncSession, task_id: int, employee_id: int
) -> OnboardingRecord:
    """Employee marks a task as complete. Auto-completes the record if all tasks done."""
    # Verify task belongs to this employee
    result = await db.execute(
        select(OnboardingTask)
        .join(OnboardingRecord)
        .where(
            OnboardingTask.id == task_id,
            OnboardingRecord.employee_id == employee_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found or does not belong to you")
    if task.is_completed:
        raise ValueError("Task already completed")

    task.is_completed = True
    task.completed_at = _utcnow()
    await db.commit()

    # Check if all tasks are now done → mark record complete + notify
    record = await _fetch_onboarding(db, task.onboarding_record_id)
    if all(t.is_completed for t in record.tasks):
        record.status = "completed"
        record.completed_at = _utcnow()
        await db.commit()
        _notify_completion(employee_id, "Onboarding")
        return await _fetch_onboarding(db, record.id)

    return record


async def get_my_onboarding(db: AsyncSession, employee_id: int) -> OnboardingRecord | None:
    result = await db.execute(
        select(OnboardingRecord)
        .options(selectinload(OnboardingRecord.tasks))
        .where(OnboardingRecord.employee_id == employee_id)
    )
    return result.scalar_one_or_none()


# ── Onboarding: HR monitoring ─────────────────────────────────────────────────

async def get_all_onboarding_records(db: AsyncSession) -> list[OnboardingRecord]:
    result = await db.execute(
        select(OnboardingRecord)
        .options(selectinload(OnboardingRecord.tasks))
        .order_by(OnboardingRecord.started_at.desc())
    )
    return result.scalars().all()


async def get_onboarding_by_employee(db: AsyncSession, employee_id: int) -> OnboardingRecord | None:
    result = await db.execute(
        select(OnboardingRecord)
        .options(selectinload(OnboardingRecord.tasks))
        .where(OnboardingRecord.employee_id == employee_id)
    )
    return result.scalar_one_or_none()


async def hr_add_custom_onboarding_task(
    db: AsyncSession, employee_id: int, data: OnboardingTaskCreate
) -> OnboardingRecord:
    """HR adds a custom task to a specific employee's onboarding."""
    record = await get_onboarding_by_employee(db, employee_id)
    if not record:
        raise ValueError("No onboarding record found for this employee")

    task = OnboardingTask(
        onboarding_record_id=record.id,
        title=data.title,
        description=data.description,
    )
    db.add(task)
    await db.commit()
    return await _fetch_onboarding(db, record.id)


# ── Offboarding: HR initiates ─────────────────────────────────────────────────

# Default offboarding checklist for everyone
DEFAULT_OFFBOARDING_TASKS = [
    ("Return ID card",            "Employee must return their university ID card"),
    ("Return laptop / equipment", "Return all university-owned devices"),
    ("Clear dues / library",      "Clear any pending dues or library books"),
    ("Handover pending work",     "Document and handover all pending tasks to team"),
    ("Exit interview",            "Complete exit interview with HR"),
    ("Final settlement",          "HR processes final salary and settlements"),
    ("Deactivate accounts",       "IT deactivates email and system access"),
]


async def initiate_offboarding(
    db: AsyncSession, data: OffboardingInitiate, hr_user_id: int
) -> OffboardingRecord:
    # Check if already offboarding
    result = await db.execute(
        select(OffboardingRecord).where(OffboardingRecord.employee_id == data.employee_id)
    )
    if result.scalar_one_or_none():
        raise ValueError("Offboarding already initiated for this employee")

    record = OffboardingRecord(
        employee_id=data.employee_id,
        initiated_by_id=hr_user_id,
        reason=data.reason,
        last_working_date=data.last_working_date,
        status="in_progress",
        clearance_status="pending",
        initiated_at=_utcnow(),
    )
    db.add(record)
    await db.flush()

    # Seed default tasks
    for title, desc in DEFAULT_OFFBOARDING_TASKS:
        task = OffboardingTask(
            offboarding_record_id=record.id,
            title=title,
            description=desc,
        )
        db.add(task)

    await db.commit()
    return await _fetch_offboarding(db, record.id)


async def hr_add_offboarding_task(
    db: AsyncSession, employee_id: int, data: OffboardingTaskCreate
) -> OffboardingRecord:
    result = await db.execute(
        select(OffboardingRecord).where(OffboardingRecord.employee_id == employee_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("No offboarding record found for this employee")

    task = OffboardingTask(
        offboarding_record_id=record.id,
        title=data.title,
        description=data.description,
    )
    db.add(task)
    await db.commit()
    return await _fetch_offboarding(db, record.id)


async def complete_offboarding_task(
    db: AsyncSession, task_id: int, offboarding_record_id: int
) -> OffboardingRecord:
    """HR marks an offboarding task as complete."""
    result = await db.execute(
        select(OffboardingTask).where(
            OffboardingTask.id == task_id,
            OffboardingTask.offboarding_record_id == offboarding_record_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")
    if task.is_completed:
        raise ValueError("Task already completed")

    task.is_completed = True
    task.completed_at = _utcnow()
    await db.commit()

    record = await _fetch_offboarding(db, offboarding_record_id)

    # Auto-complete record if all tasks done
    if all(t.is_completed for t in record.tasks):
        record.status = "completed"
        record.completed_at = _utcnow()
        await db.commit()
        _notify_completion(record.employee_id, "Offboarding")
        return await _fetch_offboarding(db, record.id)

    return record


async def update_clearance_status(
    db: AsyncSession, employee_id: int, data: ClearanceUpdate
) -> OffboardingRecord:
    if data.clearance_status not in ("pending", "cleared", "hold"):
        raise ValueError("clearance_status must be 'pending', 'cleared', or 'hold'")

    result = await db.execute(
        select(OffboardingRecord).where(OffboardingRecord.employee_id == employee_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("No offboarding record found")

    record.clearance_status = data.clearance_status
    await db.commit()
    return await _fetch_offboarding(db, record.id)


async def get_all_offboarding_records(db: AsyncSession) -> list[OffboardingRecord]:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .order_by(OffboardingRecord.initiated_at.desc())
    )
    return result.scalars().all()


async def get_offboarding_by_employee(db: AsyncSession, employee_id: int) -> OffboardingRecord | None:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .where(OffboardingRecord.employee_id == employee_id)
    )
    return result.scalar_one_or_none()