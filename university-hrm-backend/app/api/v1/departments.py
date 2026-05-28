"""
Departments API — updated for actual DB schema.
The departments table has: id (UUID), name, code, director_id, created_at, updated_at.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.department import Department
from app.db.models.user import User
from app.db.models.role import RoleEnum

router = APIRouter(prefix="/departments", tags=["Departments"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    director_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    director_id: Optional[str] = None


class DepartmentOut(BaseModel):
    id: str
    name: str
    code: str
    director_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[DepartmentOut])
async def list_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All authenticated users: list all departments."""
    result = await db.execute(select(Department).order_by(Department.name))
    return result.scalars().all()


@router.get("/{department_id}", response_model=DepartmentOut)
async def get_department(
    department_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.post("/", response_model=DepartmentOut)
async def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: create a new department."""
    now = datetime.now(timezone.utc)
    dept = Department(
        id=str(uuid.uuid4()),
        name=data.name,
        code=data.code.upper(),
        director_id=data.director_id,
        created_at=now,
        updated_at=now,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.patch("/{department_id}", response_model=DepartmentOut)
async def update_department(
    department_id: str,
    data: DepartmentUpdate,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: update a department."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    dept.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.delete("/{department_id}")
async def delete_department(
    department_id: str,
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Admin only: delete a department."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    await db.delete(dept)
    await db.commit()
    return {"status": "deleted"}