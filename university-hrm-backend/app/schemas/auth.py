from pydantic import BaseModel,EmailStr
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str= "bearer"

class TokenPayload(BaseModel):
    sub : str
    exp: datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role_name: str = "employee"
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str