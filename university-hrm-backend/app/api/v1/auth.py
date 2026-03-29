from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.schemas.auth import UserCreate, UserLogin, Token
from app.services.auth_service import register_user, authenticate_user
from app.services.audit_service import audit, AuditAction
from app.core.security import create_access_token
from app.core.rate_limit import limiter
from app.db.models.role import RoleEnum

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=dict)
@limiter.limit("3/minute")
async def register(
    request: Request,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        user = await register_user(db, user_in)
        await audit(
            db=db, action=AuditAction.EMPLOYEE_CREATE,
            user_id=user.id, user_email=user.email,
            resource="user", resource_id=user.id,
            detail=f"New user registered: {user.email}",
            request=request,
        )
        return {"msg": "User created successfully", "email": user.email, "user_id":user.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    user_in: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, user_in.email, user_in.password)
    if not user:
        # Log failed login
        await audit(
            db=db, action=AuditAction.LOGIN_FAILED,
            user_email=user_in.email,
            resource="auth",
            detail=f"Failed login attempt for {user_in.email}",
            status="failed",
            request=request,
        )
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    access_token = create_access_token(subject=user.id)

    await audit(
        db=db, action=AuditAction.LOGIN,
        user_id=user.id, user_email=user.email,
        resource="auth",
        detail=f"User logged in: {user.email}",
        request=request,
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=dict)
async def read_users_me(current_user=Depends(get_current_user)):
    return {"email": current_user.email, "role": current_user.role.name}


@router.get("/hr-only", response_model=dict)
async def hr_only(current_user=Depends(require_role(RoleEnum.HR))):
    return {"msg": "Welcome HR! You have full access."}


@router.get("/admin-only", response_model=dict)
async def admin_only(current_user=Depends(require_role(RoleEnum.ADMIN))):
    return {"msg": "Admin panel access granted."}