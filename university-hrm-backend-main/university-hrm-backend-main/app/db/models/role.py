from enum import Enum as PyEnum

from sqlalchemy import String

from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column


class RoleEnum(str, PyEnum):
    ADMIN = "admin"
    HR = "hr"
    DEPARTMENT_HEAD = "department_head"
    EMPLOYEE = "employee"
    GUEST = "guest"  # optional


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[RoleEnum] = mapped_column(String(50), unique=True, nullable=False)