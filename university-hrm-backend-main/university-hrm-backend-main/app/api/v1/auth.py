from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.schemas.auth import UserCreate, UserLogin, Token
from app.services.auth_service import register_user, authenticate_user
from app.core.security import create_access_token
from app.db.models.role import RoleEnum

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, user_in)
        return {"msg": "User created successfully", "email": user.email}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}


# Protected example routes (Person B)
@router.get("/me", response_model=dict)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {"email": current_user.email, "role": current_user.role.name}


@router.get("/hr-only", response_model=dict)
async def hr_only(current_user = Depends(require_role(RoleEnum.HR))):
    return {"msg": "Welcome HR! You have full access."}


@router.get("/admin-only", response_model=dict)
async def admin_only(current_user = Depends(require_role(RoleEnum.ADMIN))):
    return {"msg": "Admin panel access granted."}