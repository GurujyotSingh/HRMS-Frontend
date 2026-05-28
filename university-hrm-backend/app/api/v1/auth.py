"""
Auth API — updated to work with the actual DB schema.
- /auth/login returns access_token
- /auth/me returns full user profile
- /auth/register creates a new user
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from app.api.deps import get_current_user
from app.db.session import get_db
from app.db.models.user import User
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token
from app.core.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str = "New"
    last_name: str = "User"
    role_name: str = "employee"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMeResponse(BaseModel):
    id: str
    employee_id: str
    first_name: str
    last_name: str
    email: str
    work_email: str
    role: Optional[str] = None
    designation: Optional[str] = None
    department_id: Optional[str] = None
    status: Optional[str] = None
    profile_photo: Optional[str] = None
    phone: Optional[str] = None
    join_date: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login with email + password. Returns a JWT access token."""
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if user.status and user.status.lower() != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active",
        )
    access_token = create_access_token(subject=user.id)
    
    from datetime import timedelta
    refresh_token = create_access_token(subject=user.id, expires_delta=timedelta(days=7))
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=7 * 24 * 60 * 60,
        samesite="lax",
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=dict)
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    try:
        user = await register_user(db, body)
        return {"msg": "User created successfully", "email": user.email, "user_id": user.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserMeResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/logout")
async def logout(response: Response):
    """Logout (client-side: clear the token)."""
    response.delete_cookie("refresh_token")
    return {"msg": "Logged out successfully"}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response):
    """Refresh token via stored cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
        )
    try:
        from app.core.security import decode_access_token
        payload = decode_access_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError()
            
        access_token = create_access_token(subject=user_id)
        
        from datetime import timedelta
        new_refresh = create_access_token(subject=user_id, expires_delta=timedelta(days=7))
        response.set_cookie(
            key="refresh_token",
            value=new_refresh,
            httponly=True,
            max_age=7 * 24 * 60 * 60,
            samesite="lax",
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )