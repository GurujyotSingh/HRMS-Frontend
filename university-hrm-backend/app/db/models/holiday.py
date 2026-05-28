"""
Holiday model — matches actual `holidays` table.
Uses VARCHAR UUID PKs. Has name, date (DATE), type, is_optional.
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Holiday(Base):
    __tablename__ = "holidays"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String, nullable=True)   # national | state | optional | university
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
