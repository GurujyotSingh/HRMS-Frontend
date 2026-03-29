"""
Rate Limiting
-------------
Uses slowapi (wraps limits library for FastAPI).

Install: pip install slowapi

Limits:
- Login: 5 requests/minute (brute force protection)
- Register: 3 requests/minute
- AI chat: 20 requests/minute
- General API: 100 requests/minute per IP
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI

# Global limiter instance — import this in your routes
limiter = Limiter(key_func=get_remote_address)


def register_rate_limiter(app: FastAPI) -> None:
    """Call this in main.py after creating the FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)