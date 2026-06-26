"""
Onboarding service — updated for actual DB schema.
- Table is `onboarding_employees` (not `onboarding_records`)
- Table is `onboarding_tasks` (with onboarding_record_id FK to onboarding_employees)
- No OnboardingTemplate table in actual DB
- PKs are VARCHAR UUID strings
"""
import uuid
import json
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
from app.db.models.employment import UserEmployment
from app.services.ai.llm_client import call_llm


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
    commit: bool = True
) -> OnboardingEmployee:
    import logging
    logger = logging.getLogger(__name__)

    # Check for existing record to prevent duplicates
    existing = await get_onboarding_by_employee(db, employee_id)
    if existing:
        logger.warning(f"Onboarding record already exists for employee_id: {employee_id}")
        raise ValueError("Onboarding already exists for this employee")

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

    # Distribute tasks between Employee and HR
    employee_tasks = [
        "Submit Personal Documents",
        "Complete Tax Forms",
        "Read Employee Handbook",
        "Complete Cybersecurity Training"
    ]
    hr_tasks = [
        "Verify Documents",
        "Department Orientation",
        "Meet Reporting Manager",
        "IT Account Verification"
    ]

    for title in employee_tasks:
        db.add(OnboardingTask(
            id=str(uuid.uuid4()),
            onboarding_record_id=record.id,
            title=title,
            assigned_to="EMPLOYEE"
        ))

    for title in hr_tasks:
        db.add(OnboardingTask(
            id=str(uuid.uuid4()),
            onboarding_record_id=record.id,
            title=title,
            assigned_to="HR"
        ))

    if commit:
        await db.commit()
    logger.info(f"Created onboarding record for employee_id: {employee_id} with 8 tasks.")
    
    if not commit:
        await db.flush()
        return record

    return await get_onboarding_by_employee(db, employee_id)


async def check_and_complete_onboarding(db: AsyncSession, record_id: str):
    """Check if all tasks are complete, and if so, complete the onboarding."""
    result = await db.execute(
        select(OnboardingEmployee)
        .options(selectinload(OnboardingEmployee.tasks))
        .where(OnboardingEmployee.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return

    if all(task.is_completed for task in record.tasks):
        record.status = "COMPLETED"
        record.completed_at = _utcnow()
        await db.commit()


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

def get_offboarding_template(role: str, department: str) -> list[tuple[str, str]]:
    """Returns a deterministic list of offboarding tasks based on role and department."""
    # Universal tasks
    tasks = [
        ("Return Laptop", "Return university-owned laptop to IT"),
        ("Return ID Card", "Return physical access/ID card to Security"),
        ("Revoke Email Access", "IT to disable primary email account"),
        ("Exit Interview Completion", "Schedule and complete HR exit interview"),
        ("HR Final Clearance", "HR sign-off on all administrative items"),
    ]

    dept_upper = (department or "").upper()
    role_upper = (role or "").upper()

    # Faculty Template
    if role_upper in ["FACULTY", "PROFESSOR"] or "ACADEMIC" in dept_upper:
        tasks.extend([
            ("Submit Final Grades", "Ensure all course grades are published"),
            ("Transfer Course Materials", "Handover syllabus and course assets to department head"),
            ("Handover Research Projects", "Transfer PI status or data for active research"),
            ("Return Department Assets", "Return specific lab/department equipment"),
        ])
    
    # Finance Template
    elif "FINANCE" in dept_upper or "ACCOUNT" in dept_upper:
        tasks.extend([
            ("Transfer Financial Responsibilities", "Handover pending invoices or budgets"),
            ("Revoke Finance System Access", "Remove access to accounting software"),
            ("Verify Pending Transactions", "Clear any pending approvals"),
        ])

    # IT Template
    elif "IT" in dept_upper or "ENGINEER" in role_upper:
        tasks.extend([
            ("Revoke GitHub Access", "Remove from organization GitHub"),
            ("Revoke Cloud Access", "Remove AWS/GCP/Azure access"),
            ("Transfer System Ownership", "Reassign ownership of active systems"),
            ("Archive Development Assets", "Commit and push all local code"),
        ])

    # Administrative Staff Template
    else:
        tasks.extend([
            ("Transfer Records", "Handover physical and digital records"),
            ("Handover Administrative Documents", "Provide status of all ongoing administrative tasks"),
            ("Department Clearance", "Final clearance from department head"),
        ])

    return tasks


async def initiate_offboarding(
    db: AsyncSession, employee_id: str, initiated_by_id: str,
    reason: Optional[str] = None, last_working_date: Optional[datetime] = None,
    tasks_input: Optional[list] = None,
) -> OffboardingRecord:
    # Check employee exists
    emp_result = await db.execute(
        select(User).options(selectinload(User.employment).selectinload(UserEmployment.department)).where(User.id == employee_id)
    )
    employee = emp_result.scalar_one_or_none()
    if not employee:
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
        status="INITIATED",
        clearance_status="PENDING",
        initiated_at=now,
    )
    db.add(record)
    await db.flush()

    if tasks_input is not None:
        for t in tasks_input:
            task = OffboardingTask(
                id=str(uuid.uuid4()),
                offboarding_record_id=record.id,
                title=t.title,
                description=t.description,
            )
            db.add(task)
    else:
        dept_name = employee.employment.department.name if employee.employment and employee.employment.department else ""
        template_tasks = get_offboarding_template(employee.role, dept_name)
        for title, desc in template_tasks:
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
        .options(selectinload(OffboardingRecord.employee))
        .where(OffboardingRecord.id == record.id)
    )
    return result.scalar_one()


async def get_all_offboarding_records(db: AsyncSession) -> list[OffboardingRecord]:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .options(selectinload(OffboardingRecord.employee))
        .order_by(OffboardingRecord.initiated_at.desc())
    )
    return result.scalars().all()


async def get_offboarding_by_employee(
    db: AsyncSession, employee_id: str
) -> Optional[OffboardingRecord]:
    result = await db.execute(
        select(OffboardingRecord)
        .options(selectinload(OffboardingRecord.tasks))
        .options(selectinload(OffboardingRecord.employee))
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
        .options(selectinload(OffboardingRecord.employee))
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

async def analyze_exit_interview(db: AsyncSession, record_id: str) -> dict:
    """Send exit interview notes to AI and store structured results."""
    result = await db.execute(select(OffboardingRecord).where(OffboardingRecord.id == record_id))
    record = result.scalar_one_or_none()
    
    if not record:
        raise ValueError("Offboarding record not found")
        
    if not record.exit_interview_notes or not record.exit_interview_notes.strip():
        raise ValueError("Exit interview notes are required before AI analysis can be performed.")

    system_prompt = """Analyze the following employee exit interview notes.

Return ONLY valid JSON.

Schema:
{
  "sentiment": "Positive | Neutral | Negative",
  "primary_reason": "",
  "secondary_reason": "",
  "risk_level": "Low | Medium | High",
  "confidence": 0,
  "summary": ""
}

Allowed reasons:
- Compensation
- Career Growth
- Management
- Work-Life Balance
- Relocation
- Education
- Retirement
- Personal Reasons
- Organizational Changes
- Job Satisfaction
- Other

Rules:
- Confidence must be 0-100.
- Summary must be concise.
- Return JSON only.
"""

    messages = [
        {"role": "user", "content": f"Exit Interview Notes:\n\n{record.exit_interview_notes}"}
    ]

    ai_response = await call_llm(messages=messages, system=system_prompt)
    content = ai_response.get("content", "")

    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError("AI failed to return valid JSON. Please try again.")

    record.ai_sentiment = parsed.get("sentiment", "Neutral")
    record.ai_primary_reason = parsed.get("primary_reason", "Other")
    record.ai_secondary_reason = parsed.get("secondary_reason", None)
    record.ai_risk_level = parsed.get("risk_level", "Medium")
    record.ai_summary = parsed.get("summary", "")
    record.ai_confidence = parsed.get("confidence", 0)
    record.analyzed_at = _utcnow()

    await db.commit()
    await db.refresh(record)
    
    return {
        "sentiment": record.ai_sentiment,
        "primary_reason": record.ai_primary_reason,
        "secondary_reason": record.ai_secondary_reason,
        "risk_level": record.ai_risk_level,
        "confidence": record.ai_confidence,
        "summary": record.ai_summary
    }