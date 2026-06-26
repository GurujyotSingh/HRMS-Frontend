"""
Employees API — updated for actual DB schema.
Uses the `users` table directly (no separate employees table).
PKs are VARCHAR UUID strings.
"""
import csv
import io
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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

class EmployeeAddress(BaseModel):
    street: Optional[str] = None
    campus: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    model_config = {"from_attributes": True}

class EmployeeFinancials(BaseModel):
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    bank_name: Optional[str] = None
    model_config = {"from_attributes": True}

class EmployeeEmployment(BaseModel):
    department_id: Optional[str] = None
    designation: Optional[str] = None
    staff_category: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    join_date: Optional[datetime] = None
    exit_date: Optional[datetime] = None
    reporting_manager_id: Optional[str] = None
    position_id: Optional[str] = None
    model_config = {"from_attributes": True}

class EmployeeEmergencyContact(BaseModel):
    id: Optional[str] = None
    name: str
    relation: str
    phone: str
    email: Optional[str] = None
    model_config = {"from_attributes": True}

class EmployeeOut(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    email: str
    work_email: str
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    profile_photo: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    needs_password_change: Optional[bool] = False
    
    address: Optional[EmployeeAddress] = None
    financials: Optional[EmployeeFinancials] = None
    employment: Optional[EmployeeEmployment] = None
    emergency_contacts: Optional[List[EmployeeEmergencyContact]] = None

    model_config = {"from_attributes": True}


class EmployeeCreateIn(BaseModel):
    personal_email: EmailStr
    email: Optional[str] = None
    role: str
    first_name: str
    last_name: str
    employee_id: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    
    address: Optional[EmployeeAddress] = None
    financials: Optional[EmployeeFinancials] = None
    employment: Optional[EmployeeEmployment] = None
    emergency_contacts: Optional[List[EmployeeEmergencyContact]] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    nationality: Optional[str] = None
    profile_photo: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    
    address: Optional[EmployeeAddress] = None
    financials: Optional[EmployeeFinancials] = None
    employment: Optional[EmployeeEmployment] = None
    emergency_contacts: Optional[List[EmployeeEmergencyContact]] = None

class EmployeePaginatedOut(BaseModel):
    items: List[EmployeeOut]
    total: int


class BulkActionRequest(BaseModel):
    employee_ids: List[str]
    action: str  # e.g., "update_status", "update_department", "update_role", "delete"
    value: Optional[str] = None


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


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
async def create_new_employee(
    body: EmployeeCreateIn,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Create a new employee."""
    from app.services.employee_service import create_employee
    try:
        return await create_employee(db, body.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=EmployeePaginatedOut)
async def list_all_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=10000),
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("first_name"),
    sort_dir: Optional[str] = Query("asc"),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin/HOD: list all employees with advanced filters, sorting, and pagination."""
    items, total = await get_employees(
        db, 
        skip=skip, 
        limit=limit, 
        department_id=department_id, 
        status=status, 
        role=role,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    return {"items": items, "total": total}


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


@router.post("/{employee_id}/reset-password")
async def reset_employee_password(
    employee_id: str,
    current_user: User = Depends(require_role(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Super Admin: Force reset an employee's password and email them the new temporary password."""
    employee = await get_employee_by_id(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    import secrets
    import string
    import asyncio
    from app.core.security import get_password_hash
    from app.services.email_service import send_credentials_email

    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    
    employee.password_hash = get_password_hash(temp_password)
    employee.needs_password_change = True
    employee.failed_login_attempts = 0
    employee.locked_until = None
    
    db.add(employee)
    await db.commit()
    
    # Send email asynchronously
    email_to_use = employee.personal_email or employee.email
    if email_to_use:
        emp_name = f"{employee.first_name} {employee.last_name}"
        asyncio.create_task(send_credentials_email(
            personal_email=employee.personal_email,
            work_email=employee.email,
            password=temp_password,
            employee_name=emp_name
        ))
        
    return {"detail": "Password reset successfully and email dispatched."}


@router.get("/export/csv")
async def export_employees_csv(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("first_name"),
    sort_dir: Optional[str] = Query("asc"),
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Export filtered employees to CSV."""
    # Get all matching employees without limit for export
    items, _ = await get_employees(
        db, 
        skip=0, 
        limit=100000,  # Arbitrarily large limit for export 
        department_id=department_id, 
        status=status, 
        role=role,
        search=search,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
    
    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header row
    writer.writerow([
        "Employee ID", "First Name", "Last Name", "Email", "Role", 
        "Department ID", "Status", "Join Date", "Employment Type"
    ])
    
    for emp in items:
        department_id = emp.employment.department_id if emp.employment else ""
        join_date = emp.employment.join_date.strftime("%Y-%m-%d") if emp.employment and emp.employment.join_date else ""
        employment_type = emp.employment.employment_type if emp.employment else ""
        
        writer.writerow([
            emp.employee_id, emp.first_name, emp.last_name, emp.email, emp.role,
            department_id, emp.status, 
            join_date, 
            employment_type
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employees_export.csv"}
    )

@router.post("/bulk")
async def bulk_action(
    body: BulkActionRequest,
    current_user: User = Depends(require_role(RoleEnum.HR, RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """HR/Admin: Perform a bulk action on multiple employees."""
    success_count = 0
    for emp_id in body.employee_ids:
        employee = await get_employee_by_id(db, emp_id)
        if not employee:
            continue
            
        if body.action == "update_status" and body.value:
            employee.status = body.value.upper()
            success_count += 1
        elif body.action == "update_department" and body.value:
            from app.db.models.employment import UserEmployment
            employment = await db.scalar(select(UserEmployment).where(UserEmployment.user_id == emp_id))
            if employment:
                employment.department_id = body.value
            else:
                db.add(UserEmployment(user_id=emp_id, department_id=body.value))
            success_count += 1
        elif body.action == "update_role" and body.value:
            employee.role = body.value.upper()
            success_count += 1
        elif body.action == "delete":
            # Just a soft delete or deactivate for now, deleting users fully is dangerous
            employee.status = "INACTIVE"
            success_count += 1
            
        employee.updated_at = datetime.now(timezone.utc)
        
    if success_count > 0:
        await db.commit()
        
    return {"message": f"Successfully processed {success_count} employees."}