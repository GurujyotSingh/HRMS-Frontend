"""
Attendance API — updated for actual DB schema.
- Uses check_in / check_out (not clock_in / clock_out)
- employee_id = user.id (UUID string, no separate employee table)
- PKs are VARCHAR UUID strings
"""
from datetime import datetime, date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.models.role import RoleEnum
from app.db.models.user import User
from app.db.session import get_db
from app.services import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    date: str
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    total_hours: Optional[float] = None
    status: Optional[str] = None
    is_late: bool = False
    notes: Optional[str] = None
    corrected_by: Optional[str] = None
    corrected_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class AttendancePaginatedOut(BaseModel):
    items: list[AttendanceOut]
    total: int


class AttendanceUpdateHR(BaseModel):
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    is_late: Optional[bool] = None


# ── Employee: check in/out ────────────────────────────────────────────────────

@router.get("/", response_model=AttendancePaginatedOut)
async def list_attendance(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    date_val: Optional[date] = Query(None, alias="date"),
    employee_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select, func, extract
    from app.db.models.attendance import Attendance
    
    # Non-HR can only see their own attendance
    is_privileged = False
    if current_user.role and current_user.role.lower() in ["hr", "admin", "super_admin", "hr_manager", "hr_staff"]:
        is_privileged = True
        
    if not is_privileged:
        employee_id = current_user.id
        
    query = select(Attendance)
    
    if employee_id:
        query = query.where(Attendance.employee_id == employee_id)
    if month:
        query = query.where(extract("month", Attendance.date) == month)
    if year:
        query = query.where(extract("year", Attendance.date) == year)
    if date_val:
        query = query.where(Attendance.date == date_val)
        
    # Count total
    count_query = select(func.count(Attendance.id)).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    # Get items
    query = query.order_by(Attendance.date.desc(), Attendance.check_in.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return {"items": items, "total": total}


@router.post("/clock-in", response_model=AttendanceOut)
async def clock_in(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in for today."""
    try:
        return await attendance_service.clock_in(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/clock-out", response_model=AttendanceOut)
async def clock_out(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check out for today."""
    try:
        return await attendance_service.clock_out(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/today", response_model=Optional[AttendanceOut])
async def today_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's attendance status for today."""
    return await attendance_service.get_today_status(db, current_user.id)


@router.get("/my", response_model=list[AttendanceOut])
async def my_attendance(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View own attendance for a given month."""
    return await attendance_service.get_own_attendance(db, current_user.id, month, year)


# ── HR routes ─────────────────────────────────────────────────────────────────

@router.get("/hr/today", response_model=list[AttendanceOut])
async def hr_today(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    """HR: all employee attendance records for today."""
    return await attendance_service.get_all_attendance_today(db)


@router.get("/hr/employee/{employee_id}", response_model=list[AttendanceOut])
async def hr_employee_attendance(
    employee_id: str,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    """HR: view a specific employee's attendance for a month."""
    return await attendance_service.get_own_attendance(db, employee_id, month, year)


@router.post("/hr/auto-clock-out", response_model=dict)
async def hr_auto_clock_out(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    """Auto check-out all employees who forgot to check out today."""
    count = await attendance_service.auto_clock_out_missing(db)
    return {"msg": f"Auto checked out {count} employee(s)."}


@router.post("/auto-clock-out", response_model=dict)
async def auto_clock_out_alias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    """Alias for auto check-out."""
    count = await attendance_service.auto_clock_out_missing(db)
    return {"msg": f"Auto checked out {count} employee(s)."}


@router.patch("/hr/{attendance_id}", response_model=AttendanceOut)
async def hr_update_attendance(
    attendance_id: str,
    body: AttendanceUpdateHR,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
):
    """HR: manually edit an attendance record."""
    try:
        updates = body.model_dump(exclude_unset=True)
        return await attendance_service.update_attendance_by_hr(db, attendance_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))