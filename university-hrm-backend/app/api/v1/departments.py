from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.db.session import get_db
from app.db.models.role import RoleEnum
from app.schemas.department import DepartmentCreate, DepartmentRead
from app.services.department_service import create_department, get_departments

router = APIRouter(prefix="/departments", tags=["departments"])

@router.post("/", response_model=DepartmentRead)
async def create_new_department(
    dept_in: DepartmentCreate,
    current_user = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await create_department(db, dept_in)

@router.get("/", response_model=list[DepartmentRead])
async def list_departments(
    current_user = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await get_departments(db)