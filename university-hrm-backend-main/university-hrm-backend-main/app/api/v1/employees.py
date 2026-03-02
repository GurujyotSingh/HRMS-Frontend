from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.role import RoleEnum
from app.db.models.employee import Employee
from app.db.models.user import User
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate
from app.services.employee_service import (
    get_employee_by_id,
    get_employees,
    create_employee,
    update_employee,
    get_employee_by_user_id,
)

router = APIRouter(prefix="/employees", tags=["employees"])


# ====================== SELF-SERVICE ======================
@router.get("/me", response_model=EmployeeRead)
async def get_own_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    employee = await get_employee_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return employee


@router.patch("/me", response_model=EmployeeRead)
async def update_own_profile(
    employee_in: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    employee = await get_employee_by_user_id(db, current_user.id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    return await update_employee(db, employee, employee_in)


# ====================== HR ONLY ======================
@router.get("/", response_model=list[EmployeeRead])
async def list_all_employees(
    current_user = Depends(require_role(RoleEnum.HR)),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
):
    return await get_employees(db, skip=skip, limit=limit)


@router.post("/", response_model=EmployeeRead)
async def create_new_employee(
    employee_in: EmployeeCreate,
    current_user = Depends(require_role(RoleEnum.HR)),
    db: AsyncSession = Depends(get_db),
):
    return await create_employee(db, employee_in)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: int,
    current_user = Depends(require_role(RoleEnum.HR)),
    db: AsyncSession = Depends(get_db),
):
    employee = await get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee