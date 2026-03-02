from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.db.models.role import Role, RoleEnum
from app.core.security import get_password_hash, verify_password
from app.schemas.auth import UserCreate


async def register_user(db: AsyncSession, user_in: UserCreate) -> User:
    # Check if email exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    # Get role
    result = await db.execute(select(Role).where(Role.name == RoleEnum(user_in.role_name)))
    role = result.scalar_one_or_none()
    if not role:
        raise ValueError(f"Role '{user_in.role_name}' not found")

    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role_id=role.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user