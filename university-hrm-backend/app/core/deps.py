import contextvars
from typing import Generator
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db.session import SessionLocal
from ..db.models import User

# Context variable to store the current user in request lifecycle
_user_ctx = contextvars.ContextVar("current_user", default=None)

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a DB session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db)) -> User:
    """Retrieve the currently authenticated user from the request.
    For now this is a placeholder that expects a user ID in a header `X-User-Id`.
    In a real system this would verify JWT tokens.
    """
    # Placeholder implementation – read from header (to be replaced by proper auth)
    from fastapi import Request
    request: Request = Depends()
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
        )
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
