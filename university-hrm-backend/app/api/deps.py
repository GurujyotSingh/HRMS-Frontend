# from typing import Annotated
# from fastapi import Depends, HTTPException, status
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import JWTError
# from sqlalchemy import select
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.core.security import decode_access_token
# from app.db.models.user import User
# from app.db.session import get_db
# from app.db.models.role import RoleEnum

# # Simple Bearer – gives clean "Value" field in Swagger Authorize popup
# security = HTTPBearer(
#     scheme_name="JWT Bearer",
#     description="Enter your JWT as: Bearer <token> (or just the token)",
#     auto_error=True
# )

# async def get_current_user(
#     credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
#     db: AsyncSession = Depends(get_db),
# ) -> User:
#     token = credentials.credentials  # Automatically gets the part after "Bearer "

#     print("DEBUG: Received token:", token[:20] + "...")  # Temporary debug

#     try:
#         payload = decode_access_token(token)
#         print("DEBUG: Decoded payload:", payload)  # Temporary
#         user_id: int | None = payload.get("sub")
#         if user_id is None:
#             raise ValueError("No sub in token")
#         user_id = int(user_id)
#     except (ValueError, TypeError, JWTError) as e:
#         print("DEBUG: Token validation failed:", str(e))
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid token",
#             headers={"WWW-Authenticate": "Bearer"},
#         )

#     result = await db.execute(select(User).where(User.id == user_id))
#     user = result.scalar_one_or_none()
#     if not user or not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid or inactive user",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     return user

# # require_role stays the same
# def require_role(required_role: RoleEnum):
#     def role_checker(current_user: User = Depends(get_current_user)):
#         if current_user.role.name != required_role.value:
#             raise HTTPException(
#                 status_code=403,
#                 detail=f"Insufficient privileges. Required: {required_role.value}"
#             )
#         return current_user
#     return role_checker

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import selectinload                        
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db
from app.db.models.role import RoleEnum

# Simple Bearer – gives clean "Value" field in Swagger Authorize popup
security = HTTPBearer(
    scheme_name="JWT Bearer",
    description="Enter your JWT as: Bearer <token> (or just the token)",
    auto_error=True
)

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials  # Automatically gets the part after "Bearer "

    print("DEBUG: Received token:", token[:20] + "...")  # Temporary debug

    try:
        payload = decode_access_token(token)
        print("DEBUG: Decoded payload:", payload)  # Temporary
        user_id: int | None = payload.get("sub")
        if user_id is None:
            raise ValueError("No sub in token")
        user_id = int(user_id)
    except (ValueError, TypeError, JWTError) as e:
        print("DEBUG: Token validation failed:", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(User)
        .options(selectinload(User.role))                       
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
def require_role(*required_roles: RoleEnum):
    def role_checker(current_user: User = Depends(get_current_user)):
        # Admin always has access to everything
        if current_user.role.name == RoleEnum.ADMIN.value:
            return current_user
        if current_user.role.name not in [r.value for r in required_roles]:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient privileges. Required: {[r.value for r in required_roles]}"
            )
        return current_user
    return role_checker