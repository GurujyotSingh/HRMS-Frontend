from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.schemas.attendance import AttendanceRead, AttendanceSummary
from app.services import attendance_service
from app.services.employee_service import get_employee_by_user_id, get_employee_by_id

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ── Shared helper ─────────────────────────────────────────────────────────────

async def _resolve_employee(db, user_id):
    emp = await get_employee_by_user_id(db, user_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return emp


# ── Employee: clock in/out ────────────────────────────────────────────────────

@router.post(
    "/clock-in",
    response_model=AttendanceRead,
    summary="Clock in for today",
    description="Marks you as present. Records whether you arrived late (after 9:00 AM). Only one clock-in per day allowed.",
)
async def clock_in(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await attendance_service.clock_in(db, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post(
    "/clock-out",
    response_model=AttendanceRead,
    summary="Clock out for today",
    description="Records your clock-out time and calculates total hours worked.",
)
async def clock_out(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    try:
        return await attendance_service.clock_out(db, employee.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/today",
    response_model=AttendanceRead | None,
    summary="Get your clock-in status for today",
)
async def today_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await attendance_service.get_today_status(db, employee.id)


# ── Employee: own history & summary ──────────────────────────────────────────

@router.get(
    "/my",
    response_model=list[AttendanceRead],
    summary="View your attendance for a given month",
)
async def my_attendance(
    month: int = Query(..., ge=1, le=12, description="Month (1-12)"),
    year: int = Query(..., ge=2020, description="Year e.g. 2026"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await attendance_service.get_own_attendance(db, employee.id, month, year)


@router.get(
    "/my/summary",
    response_model=AttendanceSummary,
    summary="Monthly attendance summary (present, late, absent, total hours)",
)
async def my_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    employee = await _resolve_employee(db, current_user.id)
    return await attendance_service.get_monthly_summary(db, employee.id, month, year)


# ── HR routes ─────────────────────────────────────────────────────────────────

@router.get(
    "/hr/today",
    response_model=list[AttendanceRead],
    summary="HR: view all employee clock-ins for today",
)
async def hr_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await attendance_service.get_all_attendance_today(db)


@router.get(
    "/hr/employee/{employee_id}",
    response_model=list[AttendanceRead],
    summary="HR: view a specific employee's attendance for a month",
)
async def hr_employee_attendance(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await attendance_service.get_employee_attendance_for_hr(db, employee_id, month, year)


@router.get(
    "/hr/employee/{employee_id}/summary",
    response_model=AttendanceSummary,
    summary="HR: monthly summary for a specific employee",
)
async def hr_employee_summary(
    employee_id: int,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    return await attendance_service.get_monthly_summary(db, employee_id, month, year)


@router.post(
    "/hr/auto-clock-out",
    summary="HR: auto clock-out all employees who forgot to clock out today",
    description=(
        "Sets clock_out = 6:00 PM for anyone who clocked in but didn't clock out. "
        "Run this at end of day. Marks records as `is_auto_clocked_out = true`."
    ),
    response_model=dict,
)
async def hr_auto_clock_out(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    count = await attendance_service.auto_clock_out_missing(db)
    return {"msg": f"Auto clocked out {count} employee(s)."}