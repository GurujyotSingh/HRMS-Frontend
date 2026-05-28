from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    exp: datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str = "New"
    last_name: str = "User"
    role_name: str = "employee"


class UserLogin(BaseModel):
    email: EmailStr
    password: str