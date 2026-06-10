"""
API Dependencies — updated for the actual DB schema.
- Users table has `role` as a VARCHAR string (e.g. "admin", "hr", "employee")
- No separate roles table or role_id FK
- Password field is `password_hash`
- PKs are VARCHAR UUID strings
"""
from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db
from app.db.models.role import RoleEnum

security = HTTPBearer(
    scheme_name="JWT Bearer",
    description="Enter your JWT access token",
    auto_error=True,
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode JWT and return the current authenticated user."""
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
        user_id: Optional[str] = payload.get("sub")
        if user_id is None:
            raise ValueError("No sub in token")
    except (ValueError, TypeError, JWTError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == str(user_id)))
    user = result.scalar_one_or_none()
    if not user or (user.status and user.status != "ACTIVE"):  # enum fix
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*required_roles: RoleEnum):
    """
    Dependency factory that checks if the current user has one of the required roles.
    Admin always has access to everything.
    Roles are stored as plain strings in users.role column.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = (current_user.role or "").lower()
        # Admin bypasses all role restrictions
        if user_role == RoleEnum.ADMIN.value or user_role == "admin" or user_role == "super_admin":
            return current_user
        # Check if user's role matches any of the required roles
        allowed = [r.value.lower() if isinstance(r, RoleEnum) else r.lower() for r in required_roles]
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {allowed}",
            )
        return current_user
    return role_checker