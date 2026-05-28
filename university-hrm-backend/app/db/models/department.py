"""
Department model — matches actual `departments` table.
Uses VARCHAR UUID as PK, has code and director_id.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    director_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    director: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[director_id], lazy="selectin"
    )
