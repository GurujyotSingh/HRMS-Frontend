"""
Onboarding service — updated for actual DB schema.
- Table is `onboarding_employees` (not `onboarding_records`)
- Table is `onboarding_tasks` (with onboarding_record_id FK to onboarding_employees)
- No OnboardingTemplate table in actual DB
- PKs are VARCHAR UUID strings
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.onboarding import (
    OnboardingEmployee, OnboardingTask,
    OffboardingRecord, OffboardingTask,
)
from app.db.models.user import User


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Onboarding ────────────────────────────────────────────────────────────────

async def get_onboarding_by_employee(
    db: AsyncSession, employee_id: str
) -> Optional[OnboardingEmployee]:
    result = await db.execute(
        select(OnboardingEmployee)
        .options(selectinload(OnboardingEmployee.tasks))
        .where(OnboardingEmployee.employee_id == employee_id)
    )
    return result.scalar_one_or_none()


async def get_all_onboarding_records(db: AsyncSession) -> list[OnboardingEmployee]:
    result = await db.execute(
        select(OnboardingEmployee)
        .options(selectinload(OnboardingEmployee.tasks))
        .order_by(OnboardingEmployee.start_date.desc())
    )
    return result.scalars().all()


async def create_onboarding_for_employee(
    db: AsyncSession,
    employee_id: str,
    task_titles: Optional[list] = None,
) -> OnboardingEmployee:
    now = _utcnow()
    record = OnboardingEmployee(
        id=str(uuid.uuid4()),
        employee_id=employee_id,
        start_date=now,
        expected_completion_date=now + timedelta(days=30),
        status="IN_PROGRESS",  # enum fix
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    await db.flush()

    # Add default tasks
    default_tasks = task_titles or [
        "Submit joining documents",
        "Set up workstation",
        "Complete IT system access setup",
        "Meet with HR for orientation",
        "Review HR policies and handbook",
        "Complete mandatory training modules",
    ]
    for title in default_tasks:
        task = OnboardingTask(
            id=str(uuid.uuid4()),
            onboarding_record_id=record.id,
            title=title,
        )
        db.add(task)

    await db.commit()
    return await get_onboarding_by_employee(db, employee_id)


async def add_onboarding_task(
    db: AsyncSession, onboarding_id: str, title: str, description: Optional[str] = None
) -> OnboardingTask:
    task = OnboardingTask(
        id=str(uuid.uuid4()),
        onboarding_record_id=onboarding_id,
        title=title,
        description=description,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def complete_onboarding_task(
    db: AsyncSession, task_id: str, employee_id: Optional[str] = None
) -> OnboardingTask:
    result = await db.execute(select(OnboardingTask).where(OnboardingTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")
    task.is_completed = True
    task.completed_at = _utcnow()
    await db.commit()

    # Check if all tasks done → auto-complete record
    record_result = await db.execute(
        select(OnboardingEmployee)
        .options(selectinload(OnboardingEmployee.tasks))
        .where(OnboardingEmployee.id == task.onboarding_record_id)
    )
    record = record_result.scalar_one_or_none()
    if record and all(t.is_completed for t in record.tasks):
        record.status = "COMPLETED"  # enum fix
        record.completed_at = _utcnow()
        record.updated_at = _utcnow()
        await db.commit()

    await db.refresh(task)
    return task


# ── Offboarding ───────────────────────────────────────────────────────────────

DEFAULT_OFFBOARDING_TASKS = [
    ("Return ID card",            "Return university ID card to HR"),
    ("Return laptop / equipment", "Return all university-owned devices"),
    ("Clear dues / library",      "Clear any pending dues or library books"),
    ("Handover pending work",     "Document and handover all pending tasks"),
    ("Exit interview",            "Complete exit interview with HR"),
    ("Final settlement",          "HR processes final salary settlement"),
    ("Deactivate accounts",       "IT deactivates email and system access"),
]


async def initiate_offboarding(
    db: AsyncSession, employee_id: str, initiated_by_id: str,
    reason: Optional[str] = None, last_working_date: Optional[datetime] = None,
) -> OffboardingRecord:
    # Check employee exists
    emp_result = await db.execute(select(User).where(User.id == employee_id))
    if not emp_result.scalar_one_or_none():
        raise ValueError(f"Employee {employee_id} does not exist")

    # Check if already offboarding
    existing = await db.execute(
        select(OffboardingRecord).where(OffboardingRecord.employee_id == employee_id)
    )
    if existing.scalar_one_or_none():
        raise ValueError("Offboarding already initiated for this employee")

    now = _utcnow()
    record = OffboardingRecord(
        id=str(uuid.uuid4()),
        employee_id=employee_id,
        initiated_by_id=initiated_by_id,
        reason=reason,
        last_working_date=last_working_date,
        status="IN_PROGRESS",  # enum fix
        clearance_status="PENDING",  # enum fix
        initiated_at=now,
    )
    db.add(record)
    await db.flush()

    for title, desc in DEFAULT_OFFBOARDING_TASKS:
        task = OffboardingTask(
            id=str(uuid.uuid4()),
            offboarding_record_id=record.id,
            title=title,
            description=desc,
        )
        db.add(task)

    await db.commit()

    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .where(OffboardingRecord.id == record.id)
    )
    return result.scalar_one()


async def get_all_offboarding_records(db: AsyncSession) -> list[OffboardingRecord]:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .order_by(OffboardingRecord.initiated_at.desc())
    )
    return result.scalars().all()


async def get_offboarding_by_employee(
    db: AsyncSession, employee_id: str
) -> Optional[OffboardingRecord]:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .where(OffboardingRecord.employee_id == employee_id)
    )
    return result.scalar_one_or_none()


async def complete_offboarding_task(
    db: AsyncSession, task_id: str, offboarding_record_id: str
) -> OffboardingRecord:
    result = await db.execute(
        select(OffboardingTask).where(
            OffboardingTask.id == task_id,
            OffboardingTask.offboarding_record_id == offboarding_record_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise ValueError("Task not found")
    task.is_completed = True
    task.completed_at = _utcnow()
    await db.commit()

    record_result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .where(OffboardingRecord.id == offboarding_record_id)
    )
    record = record_result.scalar_one()

    if all(t.is_completed for t in record.tasks):
        record.status = "COMPLETED"  # enum fix
        record.completed_at = _utcnow()
        await db.commit()

    return record


async def update_clearance_status(
    db: AsyncSession, employee_id: str, clearance_status: str
) -> OffboardingRecord:
    result = await db.execute(
        select(OffboardingRecord).where(OffboardingRecord.employee_id == employee_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise ValueError("No offboarding record found")
    record.clearance_status = clearance_status
    await db.commit()
    return await get_offboarding_by_employee(db, employee_id)