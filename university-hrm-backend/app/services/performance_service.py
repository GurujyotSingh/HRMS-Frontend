from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.performance import AppraisalCycle, PerformanceGoal
from app.db.models.role import RoleEnum
from app.schemas.performance import (
    AppraisalCycleCreate, GoalCreate, GoalSelfReview,
    GoalHODReview, GoalHRFinalize,
)


def _utcnow():
    return datetime.now(timezone.utc)


# ── Appraisal Cycles (HR manages) ────────────────────────────────────────────

async def create_cycle(db: AsyncSession, data: AppraisalCycleCreate) -> AppraisalCycle:
    cycle = AppraisalCycle(**data.model_dump())
    db.add(cycle)
    await db.commit()
    await db.refresh(cycle)
    return cycle


async def get_all_cycles(db: AsyncSession) -> list[AppraisalCycle]:
    result = await db.execute(select(AppraisalCycle).order_by(AppraisalCycle.year.desc()))
    return result.scalars().all()


async def get_active_cycle(db: AsyncSession) -> AppraisalCycle | None:
    result = await db.execute(
        select(AppraisalCycle).where(AppraisalCycle.status == "active")
    )
    return result.scalar_one_or_none()


async def close_cycle(db: AsyncSession, cycle_id: int) -> AppraisalCycle:
    result = await db.execute(select(AppraisalCycle).where(AppraisalCycle.id == cycle_id))
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise ValueError("Cycle not found")
    cycle.status = "closed"
    await db.commit()
    await db.refresh(cycle)
    return cycle


# ── Employee: set goals ───────────────────────────────────────────────────────

async def create_goal(db: AsyncSession, employee_id: int, data: GoalCreate) -> PerformanceGoal:
    # Check cycle is active
    result = await db.execute(
        select(AppraisalCycle).where(AppraisalCycle.id == data.cycle_id)
    )
    cycle = result.scalar_one_or_none()
    if not cycle:
        raise ValueError("Appraisal cycle not found")
    if cycle.status != "active":
        raise ValueError("Cannot set goals for a closed appraisal cycle")

    # Check no duplicate
    existing = await db.execute(
        select(PerformanceGoal).where(
            PerformanceGoal.employee_id == employee_id,
            PerformanceGoal.cycle_id == data.cycle_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Goals already submitted for this cycle. Use update instead.")

    goal = PerformanceGoal(
        employee_id=employee_id,
        cycle_id=data.cycle_id,
        goals_text=data.goals_text,
        status="draft",
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


async def submit_goal(db: AsyncSession, goal_id: int, employee_id: int) -> PerformanceGoal:
    """Employee submits draft goals for HOD review."""
    goal = await _get_goal_for_employee(db, goal_id, employee_id)
    if goal.status != "draft":
        raise ValueError("Only draft goals can be submitted")
    goal.status = "submitted"
    goal.updated_at = _utcnow()
    await db.commit()
    await db.refresh(goal)
    return goal


async def self_review(db: AsyncSession, goal_id: int, employee_id: int, data: GoalSelfReview) -> PerformanceGoal:
    """Employee submits self-rating."""
    goal = await _get_goal_for_employee(db, goal_id, employee_id)
    if goal.status not in ("submitted", "draft"):
        raise ValueError("Cannot self-review at this stage")
    goal.self_rating = data.self_rating
    goal.self_comments = data.self_comments
    goal.updated_at = _utcnow()
    await db.commit()
    await db.refresh(goal)
    return goal


async def get_my_goals(db: AsyncSession, employee_id: int) -> list[PerformanceGoal]:
    result = await db.execute(
        select(PerformanceGoal)
        .options(selectinload(PerformanceGoal.cycle))
        .where(PerformanceGoal.employee_id == employee_id)
        .order_by(PerformanceGoal.created_at.desc())
    )
    return result.scalars().all()


# ── HOD: review goals ─────────────────────────────────────────────────────────

async def get_submitted_goals_for_hod(db: AsyncSession, department_id: int) -> list[PerformanceGoal]:
    """HOD sees submitted goals from their department."""
    from app.db.models.employee import Employee
    result = await db.execute(
        select(PerformanceGoal)
        .join(Employee, PerformanceGoal.employee_id == Employee.id)
        .options(selectinload(PerformanceGoal.cycle), selectinload(PerformanceGoal.employee))
        .where(
            Employee.department_id == department_id,
            PerformanceGoal.status == "submitted",
        )
    )
    return result.scalars().all()


async def hod_review(
    db: AsyncSession, goal_id: int, hod_user_id: int, department_id: int, data: GoalHODReview
) -> PerformanceGoal:
    from app.db.models.employee import Employee
    result = await db.execute(
        select(PerformanceGoal)
        .join(Employee, PerformanceGoal.employee_id == Employee.id)
        .where(
            PerformanceGoal.id == goal_id,
            Employee.department_id == department_id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise ValueError("Goal not found or not in your department")
    if goal.status != "submitted":
        raise ValueError("Can only review submitted goals")

    goal.hod_rating = data.hod_rating
    goal.hod_comments = data.hod_comments
    goal.reviewed_by_id = hod_user_id
    goal.reviewed_at = _utcnow()
    goal.status = "hod_reviewed"
    goal.updated_at = _utcnow()
    await db.commit()
    await db.refresh(goal)
    return goal


# ── HR: view all + finalize ───────────────────────────────────────────────────

async def get_all_goals(db: AsyncSession, cycle_id: int | None = None) -> list[PerformanceGoal]:
    query = select(PerformanceGoal).options(
        selectinload(PerformanceGoal.cycle),
        selectinload(PerformanceGoal.employee),
    )
    if cycle_id:
        query = query.where(PerformanceGoal.cycle_id == cycle_id)
    result = await db.execute(query.order_by(PerformanceGoal.updated_at.desc()))
    return result.scalars().all()


async def hr_finalize(
    db: AsyncSession, goal_id: int, hr_user_id: int, data: GoalHRFinalize
) -> PerformanceGoal:
    result = await db.execute(select(PerformanceGoal).where(PerformanceGoal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise ValueError("Goal not found")
    if goal.status != "hod_reviewed":
        raise ValueError("Goal must be HOD-reviewed before HR can finalize")

    goal.final_rating = data.final_rating
    goal.hr_comments = data.hr_comments
    goal.finalized_by_id = hr_user_id
    goal.finalized_at = _utcnow()
    goal.status = "finalized"
    goal.updated_at = _utcnow()
    await db.commit()
    await db.refresh(goal)
    return goal


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_goal_for_employee(db: AsyncSession, goal_id: int, employee_id: int) -> PerformanceGoal:
    result = await db.execute(
        select(PerformanceGoal).where(
            PerformanceGoal.id == goal_id,
            PerformanceGoal.employee_id == employee_id,
        )
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise ValueError("Goal not found or does not belong to you")
    return goal