"""
Employee service — updated for actual DB schema.
The `users` table contains all employee data (no separate employees table).
PKs are VARCHAR UUID strings.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.user import User
from app.db.models.department import Department


async def get_employees(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    role: Optional[str] = None,
) -> list[User]:
    """Get all employees (users) with optional filters."""
    stmt = (
        select(User)
        .order_by(User.first_name)
        .offset(skip)
        .limit(limit)
    )
    if department_id:
        stmt = stmt.where(User.department_id == department_id)
    if status:
        stmt = stmt.where(User.status == status)
    if role:
        stmt = stmt.where(User.role == role)
    result = await db.execute(stmt)
    return result.scalars().all()


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