from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User

class BankBranch(Base):
    __tablename__ = "bank_branches"
    
    ifsc_code: Mapped[str] = mapped_column(String, primary_key=True)
    bank_name: Mapped[str] = mapped_column(String, nullable=False)

class UserFinancial(Base):
    __tablename__ = "user_financials"
    
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    pan_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    uan_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bank_account_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String, ForeignKey("bank_branches.ifsc_code"), nullable=True)
    
    bank_branch: Mapped[Optional["BankBranch"]] = relationship("BankBranch", lazy="selectin")
    user: Mapped["User"] = relationship("User", back_populates="financials")

    @property
    def bank_name(self) -> Optional[str]:
        return self.bank_branch.bank_name if self.bank_branch else None
