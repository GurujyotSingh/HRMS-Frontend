"""
Employee service — updated for actual DB schema.
The `users` table contains all employee data (no separate employees table).
PKs are VARCHAR UUID strings.
"""
from datetime import datetime, timezone
from sqlalchemy import select, func, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import Optional, Tuple

from app.db.models.user import User
from app.db.models.address import UserAddress, PostalCode
from app.db.models.financial import UserFinancial, BankBranch
from app.db.models.employment import UserEmployment
from app.db.models.emergency_contact import UserEmergencyContact
from app.db.models.department import Department
from app.core.security import get_password_hash
from app.services.email_service import send_credentials_email
import uuid
import secrets
import string


async def get_employees(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "first_name",
    sort_dir: Optional[str] = "asc",
) -> Tuple[list[User], int]:
    """Get all employees (users) with pagination, sorting, and filters."""
    
    # Base query for filtering
    base_query = select(User).options(
        selectinload(User.employment),
        selectinload(User.address),
        selectinload(User.financials).selectinload(UserFinancial.bank_branch),
    )
    
    if department_id:
        base_query = base_query.join(User.employment).where(UserEmployment.department_id == department_id)
    if status:
        base_query = base_query.where(User.status == status)
    if role:
        base_query = base_query.where(User.role == role)
    if search:
        search_term = f"%{search}%"
        base_query = base_query.where(
            or_(
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                User.email.ilike(search_term),
                User.employee_id.ilike(search_term)
            )
        )
        
    # Get total count
    count_stmt = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_stmt)
    total_count = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(User, sort_by, User.first_name)
    if sort_dir.lower() == "desc":
        sort_column = desc(sort_column)
        
    stmt = base_query.order_by(sort_column).offset(skip).limit(limit)
    
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    return items, total_count

async def create_employee(db: AsyncSession, data: dict) -> User:
    """Create a new employee (user) with full profile fields."""
    
    # 1. Auto-generate work email if not provided
    first_name = data.get("first_name", "New").strip()
    last_name = data.get("last_name", "Employee").strip()
    
    email = data.get("email")
    if not email:
        base_email = f"{first_name.lower()}.{last_name.lower()}@university.edu".replace(" ", "")
        email = base_email
        counter = 1
        while True:
            exists = await db.execute(select(User).where(User.email == email))
            if not exists.scalar_one_or_none():
                break
            email = f"{first_name.lower()}.{last_name.lower()}{counter}@university.edu".replace(" ", "")
            counter += 1
    else:
        email = email.lower()
        exists = await db.execute(select(User).where(User.email == email))
        if exists.scalar_one_or_none():
            raise ValueError("Email already registered")

    # 2. Check director constraints if role is DIRECTOR
    if data.get("role") == "DIRECTOR" and data.get("employment") and data["employment"].get("department_id"):
        dept_id = data["employment"]["department_id"]
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept and dept.director_id:
            raise ValueError("This department already has a director assigned.")

    # 3. Auto-generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))


    now = datetime.now(timezone.utc)
    new_id = str(uuid.uuid4())
    
    emp_id = data.get("employee_id", "")
    if not emp_id or "AUTO" in emp_id:
        pfx = emp_id.replace("AUTO", "") if "AUTO" in emp_id else "EMP-"
        emp_id = f"{pfx}{new_id[:8].upper()}"

    user = User(
        id=new_id,
        employee_id=emp_id,
        first_name=data.get("first_name", "New"),
        last_name=last_name,
        email=email,
        work_email=email,
        personal_email=data.get("personal_email"),
        password_hash=get_password_hash(temp_password),
        role=data.get("role") or "STAFF",
        phone=data.get("phone"),
        gender=data.get("gender"),
        date_of_birth=data.get("date_of_birth"),
        status="ACTIVE",
        needs_password_change=True,
        failed_login_attempts=0,
        created_at=now,
        updated_at=now,
    )
    
    if data.get("address"):
        addr = data["address"]
        user.address = UserAddress(street=addr.get("street"), campus=addr.get("campus"), pincode=addr.get("pincode"))
        
    if data.get("financials"):
        fin = data["financials"]
        if fin.get("ifsc_code"):
            from app.db.models.financial import BankBranch
            existing_bank = await db.scalar(select(BankBranch).where(BankBranch.ifsc_code == fin["ifsc_code"]))
            if not existing_bank:
                db.add(BankBranch(ifsc_code=fin["ifsc_code"], bank_name=fin.get("bank_name") or "Unknown Bank"))
                await db.flush()
        user.financials = UserFinancial(pan_number=fin.get("pan_number"), uan_number=fin.get("uan_number"), bank_account_number=fin.get("bank_account_number"), ifsc_code=fin.get("ifsc_code"))
        
    if data.get("employment"):
        emp = data["employment"]
        user.employment = UserEmployment(department_id=emp.get("department_id"), designation=emp.get("designation"), staff_category=emp.get("staff_category"), employment_type=emp.get("employment_type"), salary=emp.get("salary"), join_date=emp.get("join_date"), exit_date=emp.get("exit_date"), reporting_manager_id=emp.get("reporting_manager_id"), position_id=emp.get("position_id"))
        
    if data.get("emergency_contacts"):
        user.emergency_contacts = [UserEmergencyContact(id=str(uuid.uuid4()), name=c["name"], relation=c["relation"], phone=c["phone"], email=c.get("email")) for c in data["emergency_contacts"]]
        
    db.add(user)
    
    ONBOARDING_REQUIRED_ROLES = ["DIRECTOR", "FACULTY", "STAFF", "ACCOUNTANT"]

    # Auto-generate onboarding record and tasks within the same transaction (only for eligible roles)
    if user.role in ONBOARDING_REQUIRED_ROLES:
        from app.services.onboarding_service import create_onboarding_for_employee
        await create_onboarding_for_employee(db, user.id, commit=False)

    await db.commit()
    await db.refresh(user)
    
    # Update Department director_id if applicable
    if data.get("role") == "DIRECTOR" and data.get("employment") and data["employment"].get("department_id"):
        dept_id = data["employment"]["department_id"]
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept:
            dept.director_id = user.id
            await db.commit()
    
    # Send welcome email asynchronously
    personal_email = data.get("personal_email")
    emp_name = f"{first_name} {last_name}"
    import asyncio
    asyncio.create_task(send_credentials_email(personal_email, email, temp_password, emp_name))
    
    return user


async def get_employee_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    """Get a single employee by their UUID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_employee_by_employee_id(db: AsyncSession, employee_id: str) -> Optional[User]:
    """Get employee by their employee_id code (e.g. EMP001)."""
    result = await db.execute(select(User).where(User.employee_id == employee_id))
    return result.scalar_one_or_none()


async def update_employee(db: AsyncSession, user: User, update_data: dict) -> User:
    """Update an employee's profile fields."""
    
    role = update_data.get("role", user.role)
    status = update_data.get("status", user.status)
    
    dept_id = None
    if "employment" in update_data and update_data["employment"] and "department_id" in update_data["employment"]:
        dept_id = update_data["employment"]["department_id"]
    elif user.employment:
        dept_id = user.employment.department_id

    if role == "DIRECTOR" and status == "ACTIVE" and dept_id:
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept and dept.director_id and dept.director_id != user.id:
            old_dir_res = await db.execute(select(User).where(User.id == dept.director_id))
            old_dir = old_dir_res.scalar_one_or_none()
            if old_dir and old_dir.status == "ACTIVE":
                raise ValueError("This department already has an active director assigned.")
            elif old_dir:
                old_dir.role = "FACULTY"
                db.add(old_dir)
            
    for field, value in update_data.items():
        if field in ["address", "financials", "employment", "emergency_contacts"]:
            continue
        if hasattr(user, field):
            setattr(user, field, value)
            
    if "address" in update_data and update_data["address"]:
        if not user.address:
            user.address = UserAddress(user_id=user.id)
        for k, v in update_data["address"].items():
            setattr(user.address, k, v)
            
    if "financials" in update_data and update_data["financials"]:
        fin = update_data["financials"]
        if fin.get("ifsc_code"):
            from app.db.models.financial import BankBranch
            existing_bank = await db.scalar(select(BankBranch).where(BankBranch.ifsc_code == fin["ifsc_code"]))
            if not existing_bank:
                db.add(BankBranch(ifsc_code=fin["ifsc_code"], bank_name=fin.get("bank_name") or "Unknown Bank"))
                await db.flush()
        if not user.financials:
            user.financials = UserFinancial(user_id=user.id)
        for k, v in fin.items():
            if k != "bank_name": # bank_name is for BankBranch, not UserFinancial
                setattr(user.financials, k, v)
            
    if "employment" in update_data and update_data["employment"]:
        if not user.employment:
            user.employment = UserEmployment(user_id=user.id)
        for k, v in update_data["employment"].items():
            setattr(user.employment, k, v)
            
    if "emergency_contacts" in update_data and update_data["emergency_contacts"] is not None:
        user.emergency_contacts = []
        for c in update_data["emergency_contacts"]:
            user.emergency_contacts.append(UserEmergencyContact(id=str(uuid.uuid4()), user_id=user.id, name=c["name"], relation=c["relation"], phone=c["phone"], email=c.get("email")))

    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    
    # Update Department director_id if applicable
    if user.role == "DIRECTOR" and user.status == "ACTIVE" and dept_id:
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept and dept.director_id != user.id:
            dept.director_id = user.id
            await db.commit()
            
    # Cleanup Department director_id if user is no longer an active director
    elif (user.role != "DIRECTOR" or user.status != "ACTIVE") and dept_id:
        dept_res = await db.execute(select(Department).where(Department.id == dept_id))
        dept = dept_res.scalar_one_or_none()
        if dept and dept.director_id == user.id:
            dept.director_id = None
            await db.commit()
            
    return user