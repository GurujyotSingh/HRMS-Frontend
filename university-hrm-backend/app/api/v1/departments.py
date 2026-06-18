import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.db.models.department import Department
from app.db.models.user import User
from app.db.models.employment import UserEmployment
from app.services.email_service import send_director_assignment_email

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
    director_name: Optional[str] = None
    director_email: Optional[str] = None
    director_status: Optional[str] = None
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
    result = await db.execute(
        select(Department)
        .options(selectinload(Department.director))
        .order_by(Department.name)
    )
    depts = result.scalars().all()
    out = []
    for d in depts:
        data = {
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "director_id": d.director_id,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "director_name": f"{d.director.first_name} {d.director.last_name or ''}".strip() if d.director else None,
            "director_email": d.director.email if d.director else None, "director_status": d.director.status if d.director else None,
            "director_status": d.director.status if d.director else None
        }
        out.append(data)
    return out

@router.get("/{department_id}", response_model=DepartmentOut)
async def get_department(
    department_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific department by ID."""
    result = await db.execute(
        select(Department)
        .options(selectinload(Department.director))
        .where(Department.id == department_id)
    )
    d = result.scalar_one_or_none()
    if not d:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return {
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "director_id": d.director_id,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
        "director_name": f"{d.director.first_name} {d.director.last_name or ''}".strip() if d.director else None,
        "director_email": d.director.email if d.director else None, "director_status": d.director.status if d.director else None
    }

@router.post("/", response_model=DepartmentOut)
async def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_role("HR_MANAGER", "SUPER_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    """HR_MANAGER/SUPER_ADMIN: create a new department."""
    now = datetime.now(timezone.utc)
    
    existing = await db.execute(
        select(Department).where((Department.name == data.name) | (Department.code == data.code.upper()))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department with this Name or Code already exists.")

    new_dept = Department(
        id=str(uuid.uuid4()),
        name=data.name,
        code=data.code.upper(),
        director_id=None,
        created_at=now,
        updated_at=now,
    )
    db.add(new_dept)
    await db.flush() 
    
    if data.director_id:
        res = await db.execute(select(User).options(selectinload(User.employment)).where(User.id == data.director_id))
        new_dir = res.scalar_one_or_none()
        if not new_dir:
            raise HTTPException(status_code=404, detail=f"Employee (Director) with ID {data.director_id} not found.")
            
        new_dept.director_id = new_dir.id
        new_dir.role = "DIRECTOR"
        
        if new_dir.employment:
            new_dir.employment.department_id = new_dept.id
        else:
            emp = UserEmployment(user_id=new_dir.id, department_id=new_dept.id)
            db.add(emp)
            
        asyncio.create_task(
            send_director_assignment_email(
                user_email=new_dir.email,
                employee_name=f"{new_dir.first_name} {new_dir.last_name}",
                department_name=new_dept.name
            )
        )
            
    await db.commit()
    
    res = await db.execute(select(Department).options(selectinload(Department.director)).where(Department.id == new_dept.id))
    d = res.scalar_one()
    
    return {
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "director_id": d.director_id,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
        "director_name": f"{d.director.first_name} {d.director.last_name or ''}".strip() if d.director else None,
        "director_email": d.director.email if d.director else None, "director_status": d.director.status if d.director else None
    }


@router.patch("/{department_id}", response_model=DepartmentOut)
async def update_department(
    department_id: str,
    data: DepartmentUpdate,
    current_user: User = Depends(require_role("HR_MANAGER", "SUPER_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    """HR_MANAGER/SUPER_ADMIN: update a department."""
    result = await db.execute(
        select(Department).options(selectinload(Department.director)).where(Department.id == department_id)
    )
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    update_data = data.model_dump(exclude_unset=True)
    
    if "name" in update_data:
        dept.name = update_data["name"]
    if "code" in update_data:
        dept.code = update_data["code"].upper()
        
    if "director_id" in update_data:
        new_director_id = update_data["director_id"]
        old_director_id = dept.director_id
        
        if new_director_id != old_director_id:
            if old_director_id:
                res_old = await db.execute(select(User).options(selectinload(User.employment)).where(User.id == old_director_id))
                old_dir = res_old.scalar_one_or_none()
                if old_dir and old_dir.status == "ACTIVE":
                    raise HTTPException(status_code=400, detail="Cannot manually change director. The current director is ACTIVE.")
                if old_dir and old_dir.role == "DIRECTOR":
                    old_dir.role = "FACULTY"
                    
            if new_director_id:
                res_new = await db.execute(select(User).options(selectinload(User.employment)).where(User.id == new_director_id))
                new_dir = res_new.scalar_one_or_none()
                if not new_dir:
                    raise HTTPException(status_code=404, detail=f"Employee (Director) with ID {new_director_id} not found.")
                
                new_dir.role = "DIRECTOR"
                if new_dir.employment:
                    new_dir.employment.department_id = dept.id
                else:
                    emp = UserEmployment(user_id=new_dir.id, department_id=dept.id)
                    db.add(emp)
                    
                asyncio.create_task(
                    send_director_assignment_email(
                        user_email=new_dir.email,
                        employee_name=f"{new_dir.first_name} {new_dir.last_name}",
                        department_name=dept.name
                    )
                )
                
            dept.director_id = new_director_id

    dept.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    res = await db.execute(select(Department).options(selectinload(Department.director)).where(Department.id == dept.id))
    d = res.scalar_one()
    
    return {
        "id": d.id,
        "name": d.name,
        "code": d.code,
        "director_id": d.director_id,
        "created_at": d.created_at,
        "updated_at": d.updated_at,
        "director_name": f"{d.director.first_name} {d.director.last_name or ''}".strip() if d.director else None,
        "director_email": d.director.email if d.director else None, "director_status": d.director.status if d.director else None
    }


@router.delete("/{department_id}")
async def delete_department(
    department_id: str,
    current_user: User = Depends(require_role("SUPER_ADMIN")),
    db: AsyncSession = Depends(get_db),
):
    """SUPER_ADMIN only: delete a department."""
    result = await db.execute(select(Department).where(Department.id == department_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if dept.director_id:
        res = await db.execute(select(User).options(selectinload(User.employment)).where(User.id == dept.director_id))
        old_dir = res.scalar_one_or_none()
        if old_dir and old_dir.role == "DIRECTOR":
            old_dir.role = "FACULTY"
            if old_dir.employment:
                old_dir.employment.department_id = None
            
    employments_res = await db.execute(select(UserEmployment).where(UserEmployment.department_id == department_id))
    for emp in employments_res.scalars():
        emp.department_id = None
        
    await db.delete(dept)
    await db.commit()
    return {"status": "deleted"}
