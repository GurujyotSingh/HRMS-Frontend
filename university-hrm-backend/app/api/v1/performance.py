from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.performance import (
    AppraisalCycleCreate, AppraisalCycleRead,
    GoalCreate, GoalSelfReview, GoalHODReview, GoalHRFinalize,
    PerformanceGoalRead,
)
from app.services import performance_service
from app.services.employee_service import get_employee_by_user_id

router = APIRouter(prefix="/performance", tags=["Performance"])


async def _resolve_employee(db, user_id):
    emp = await get_employee_by_user_id(db, user_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ── Appraisal Cycles (HR) ─────────────────────────────────────────────────────

@router.post("/cycles", response_model=AppraisalCycleRead, summary="HR: create appraisal cycle")
async def create_cycle(
    data: AppraisalCycleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await performance_service.create_cycle(db, data)


@router.get("/cycles", response_model=list[AppraisalCycleRead], summary="View all appraisal cycles")
async def get_cycles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await performance_service.get_all_cycles(db)


@router.get("/cycles/active", response_model=AppraisalCycleRead | None, summary="Get current active cycle")
async def get_active_cycle(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await performance_service.get_active_cycle(db)


@router.post("/cycles/{cycle_id}/close", response_model=AppraisalCycleRead, summary="HR: close a cycle")
async def close_cycle(
    cycle_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await performance_service.close_cycle(db, cycle_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Employee: goals ───────────────────────────────────────────────────────────

@router.post("/goals", response_model=PerformanceGoalRead, summary="Employee: set goals for active cycle")
async def create_goal(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await performance_service.create_goal(db, employee.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/goals/{goal_id}/submit", response_model=PerformanceGoalRead, summary="Employee: submit goals for HOD review")
async def submit_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await performance_service.submit_goal(db, goal_id, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/goals/{goal_id}/self-review", response_model=PerformanceGoalRead, summary="Employee: submit self-rating")
async def self_review(
    goal_id: int,
    data: GoalSelfReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await performance_service.self_review(db, goal_id, employee.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/goals/my", response_model=list[PerformanceGoalRead], summary="Employee: view own goals")
async def my_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await performance_service.get_my_goals(db, employee.id)


# ── HOD: review ───────────────────────────────────────────────────────────────

@router.get("/goals/hod/pending", response_model=list[PerformanceGoalRead], summary="HOD: view submitted goals in department")
async def hod_pending_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    employee = await _resolve_employee(db, current_user.id)
    if not employee.department_id:
        raise HTTPException(status_code=400, detail="No department assigned")
    return await performance_service.get_submitted_goals_for_hod(db, employee.department_id)


@router.post("/goals/{goal_id}/hod-review", response_model=PerformanceGoalRead, summary="HOD: rate and review a goal")
async def hod_review(
    goal_id: int,
    data: GoalHODReview,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    employee = await _resolve_employee(db, current_user.id)
    if not employee.department_id:
        raise HTTPException(status_code=400, detail="No department assigned")
    try:
        return await performance_service.hod_review(db, goal_id, current_user.id, employee.department_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── HR: view all + finalize ───────────────────────────────────────────────────

@router.get("/goals/hr/all", response_model=list[PerformanceGoalRead], summary="HR: view all goals (filter by cycle)")
async def hr_all_goals(
    cycle_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await performance_service.get_all_goals(db, cycle_id)


@router.post("/goals/{goal_id}/finalize", response_model=PerformanceGoalRead, summary="HR: set final rating")
async def hr_finalize(
    goal_id: int,
    data: GoalHRFinalize,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await performance_service.hr_finalize(db, goal_id, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))