from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.db.base import Base

class PostalCode(Base):
    __tablename__ = "postal_codes"
    
    pincode: Mapped[str] = mapped_column(String, primary_key=True)
    city: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    country: Mapped[str] = mapped_column(String, nullable=False)

class UserAddress(Base):
    __tablename__ = "user_addresses"
    
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    street: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    campus: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pincode: Mapped[Optional[str]] = mapped_column(String, ForeignKey("postal_codes.pincode"), nullable=True)
    
    postal_code: Mapped[Optional["PostalCode"]] = relationship("PostalCode", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="address")
