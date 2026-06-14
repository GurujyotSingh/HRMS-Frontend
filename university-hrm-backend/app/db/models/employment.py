from sqlalchemy import String, ForeignKey, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.department import Department
    from app.db.models.user import User

class UserEmployment(Base):
    __tablename__ = "user_employments"
    
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    department_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("departments.id"), nullable=True)
    designation: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    staff_category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING', name='EmploymentType', create_type=False), nullable=True)
    salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    join_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    exit_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reporting_manager_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    position_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    department: Mapped[Optional["Department"]] = relationship("Department", foreign_keys=[department_id], lazy="selectin")
    reporting_manager: Mapped[Optional["User"]] = relationship("User", remote_side="User.id", foreign_keys=[reporting_manager_id], lazy="selectin")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="employment")
