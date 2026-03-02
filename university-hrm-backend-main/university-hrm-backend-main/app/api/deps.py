from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError                     # ← THIS WAS MISSING
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db
from app.db.models.role import RoleEnum


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        user_id: int = int(payload.get("sub"))
    except (ValueError, TypeError, JWTError):
        raise HTTPException(status_code=401, detail="Invalid token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user


def require_role(required_role: RoleEnum):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.name != required_role.value:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient privileges. Required: {required_role.value}"
            )
        return current_user
    return role_checker