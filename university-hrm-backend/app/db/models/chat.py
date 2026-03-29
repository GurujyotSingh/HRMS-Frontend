from __future__ import annotations
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.user import User


class ChatSession(Base):
    """
    One session per user. Stores multi-turn conversation context.
    HR can have one active session at a time (reset to start fresh).
    """
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(200), nullable=True)   # auto-generated from first message
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # status: "active" | "closed"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped[User] = relationship("User")
    messages: Mapped[list[ChatMessage]] = relationship(
        "ChatMessage", back_populates="session",
        order_by="ChatMessage.created_at",
        cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    """
    Individual message in a chat session.
    role: "user" | "assistant" | "system"
    agent: which AI agent handled this (for logging)
    pending_confirmation: stores JSON of action waiting for HR confirmation
    """
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)        # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    agent: Mapped[str | None] = mapped_column(String(50), nullable=True) # "hr_command" | "payslip" etc.
    pending_confirmation: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON of pending action
    llm_used: Mapped[str | None] = mapped_column(String(30), nullable=True)  # "claude" | "openai"
    tokens_used: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    session: Mapped[ChatSession] = relationship("ChatSession", back_populates="messages")