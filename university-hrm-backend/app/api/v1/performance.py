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
    PerformanceGoalRead, GoalAssignHOD
)
from app.services import performance_service

router = APIRouter(prefix="/performance", tags=["Performance"])


# No separate employee table — user.id IS the employee_id
async def _resolve_employee(db, user_id: str):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    return user


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
    goal_id: str,
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
    goal_id: str,
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
    goal_id: str,
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

@router.post("/goals/assign", response_model=PerformanceGoalRead, summary="HOD: Assign goal to an employee")
async def hod_assign_goal(
    data: GoalAssignHOD,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.DEPARTMENT_HEAD)),
):
    hod = await _resolve_employee(db, current_user.id)
    if not hod.department_id:
        raise HTTPException(status_code=400, detail="You have no department assigned")
    
    # Verify the target employee belongs to HOD's department
    from app.services.employee_service import get_employee_by_id
    target_emp = await get_employee_by_id(db, data.employee_id)
    if not target_emp or target_emp.department_id != hod.department_id:
        raise HTTPException(status_code=400, detail="Cannot assign goals outside your department")

    # Create the goal acting as the employee
    try:
        from app.schemas.performance import GoalCreate
        emp_goal_data = GoalCreate(cycle_id=data.cycle_id, goals_text=data.goals_text)
        return await performance_service.create_goal(db, target_emp.id, emp_goal_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    goal_id: str,
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
    cycle_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    return await performance_service.get_all_goals(db, cycle_id)


@router.post("/goals/{goal_id}/finalize", response_model=PerformanceGoalRead, summary="HR: set final rating")
async def hr_finalize(
    goal_id: str,
    data: GoalHRFinalize,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR)),
):
    try:
        return await performance_service.hr_finalize(db, goal_id, current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))