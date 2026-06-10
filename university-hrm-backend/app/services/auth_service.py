"""
Auth service — updated to match actual DB schema.
The `users` table has `role` as a VARCHAR enum column (not a FK to a roles table).
Password field is `password_hash` (not `hashed_password`).
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.user import User
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import UserCreate


async def register_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user. Role is stored directly in the users.role column."""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    now = datetime.now(timezone.utc)
    # Generate a UUID for the new user
    new_id = str(uuid.uuid4())
    # Generate employee ID
    emp_id = f"EMP{new_id[:8].upper()}"

    user = User(
        id=new_id,
        employee_id=emp_id,
        first_name=user_in.first_name if hasattr(user_in, 'first_name') else "New",
        last_name=user_in.last_name if hasattr(user_in, 'last_name') else "User",
        email=user_in.email,
        work_email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role_name or "employee",
        status="ACTIVE",  # enum fix
        needs_password_change=False,
        failed_login_attempts=0,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    """Authenticate user by email and password."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
    # Check if locked
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        return None
    # Verify password against password_hash column
    try:
        from passlib.exc import UnknownHashError
        is_valid = verify_password(password, user.password_hash)
    except UnknownHashError:
        is_valid = False

    if not is_valid:
        # Increment failed attempts
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        await db.commit()
        return None
    # Reset failed attempts on success
    user.failed_login_attempts = 0
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)
    return user