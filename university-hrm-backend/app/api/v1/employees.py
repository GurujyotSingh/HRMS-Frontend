"""
Employees API — updated for actual DB schema.
Uses the `users` table directly (no separate employees table).
PKs are VARCHAR UUID strings.
"""
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.user import User
from app.db.models.role import RoleEnum
from app.services.employee_service import (
    get_employees,
    get_employee_by_id,
    update_employee,
)

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class EmployeeOut(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    email: str
    work_email: str
    phone: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    join_date: Optional[datetime] = None
    exit_date: Optional[datetime] = None
    status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    profile_photo: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    campus: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_email: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    position_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    join_date: Optional[datetime] = None
    exit_date: Optional[datetime] = None
    status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    profile_photo: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    campus: Optional[str] = None
    emergency_name: Optional[str] = None
    emergency_relation: Optional[str] = None
    emergency_phone: Optional[str] = None
    emergency_email: Optional[str] = None
    reporting_manager_id: Optional[str] = None
    position_id: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/me", response_model=EmployeeOut)
async def get_own_profile(
    current_user: User = Depends(get_current_user),
):
    """Return the current user's own employee profile."""
    return current_user


@router.patch("/me", response_model=EmployeeOut)
async def update_own_profile(
    body: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's own profile fields."""
    return await update_employee(db, current_user, body.model_dump(exclude_unset=True))


@router.get("/", response_model=list[EmployeeOut])
async def list_all_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin/HOD: list all employees with optional filters."""
    return await get_employees(db, skip=skip, limit=limit, department_id=department_id, status=status, role=role)


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: get a specific employee by UUID."""
    employee = await get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.patch("/{employee_id}", response_model=EmployeeOut)
async def update_employee_by_id(
    employee_id: str,
    body: EmployeeUpdate,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: update any employee's profile."""
    employee = await get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return await update_employee(db, employee, body.model_dump(exclude_unset=True))