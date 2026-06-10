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
    base_query = select(User)
    
    if department_id:
        base_query = base_query.where(User.department_id == department_id)
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

    # 2. Auto-generate temporary password
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
        status="ACTIVE",
        needs_password_change=True,
        failed_login_attempts=0,
        join_date=data.get("join_date"),
        department_id=data.get("department_id"),
        designation=data.get("designation"),
        employment_type=data.get("employment_type"),
        pan_number=data.get("pan_number"),
        uan_number=data.get("uan_number"),
        bank_name=data.get("bank_name"),
        bank_account_number=data.get("bank_account_number"),
        ifsc_code=data.get("ifsc_code"),
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
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
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return user