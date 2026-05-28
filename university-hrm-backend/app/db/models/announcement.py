"""
Announcement + AnnouncementRead models — match actual DB tables.
Uses VARCHAR UUID PKs, body (not content), author_id, target_roles[], target_departments[], priority.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    author_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    target_roles: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    target_departments: Mapped[Optional[list]] = mapped_column(ARRAY(String), nullable=True)
    priority: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # low | normal | high | urgent
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    author: Mapped["User"] = relationship("User", foreign_keys=[author_id])
    reads: Mapped[list["AnnouncementRead"]] = relationship("AnnouncementRead", back_populates="announcement")


class AnnouncementRead(Base):
    __tablename__ = "announcement_reads"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    announcement_id: Mapped[str] = mapped_column(String, ForeignKey("announcements.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    read_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    announcement: Mapped["Announcement"] = relationship("Announcement", back_populates="reads")
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
