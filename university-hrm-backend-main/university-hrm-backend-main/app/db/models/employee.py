from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.models.department import Department
from app.db.models.user import User


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False) 
    date_of_joining: Mapped[date] = mapped_column(Date, nullable=False)
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)  

    department: Mapped["Department"] = relationship("Department")
    user: Mapped["User"] = relationship("User", back_populates="employee")  