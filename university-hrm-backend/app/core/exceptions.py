"""
Standardized Error Handling
----------------------------
All errors return the same JSON shape:
{
    "error": true,
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [...],   # optional
    "timestamp": "..."
    
}
"""

from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from starlette.exceptions import HTTPException as StarletteHTTPException


def _error_response(
    code: str,
    message: str,
    status_code: int,
    details: list | None = None,
) -> JSONResponse:
    content = {
        "error": True,
        "code": code,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if details:
        content["details"] = details
    return JSONResponse(status_code=status_code, content=content)


def register_exception_handlers(app: FastAPI) -> None:
    """Call this in main.py after creating the FastAPI app."""

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            422: "UNPROCESSABLE_ENTITY",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_SERVER_ERROR",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        return _error_response(code, str(exc.detail), exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"] if loc != "body")
            details.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"],
            })
        return _error_response(
            code="VALIDATION_ERROR",
            message="Input validation failed. Please check the fields below.",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        message = "A database integrity error occurred."
        detail_msg = ""
        
        # Attempt to extract the specific detail from asyncpg/psycopg2 errors
        if hasattr(exc.orig, 'diag') and hasattr(exc.orig.diag, 'message_detail'):
            detail_msg = f" ({exc.orig.diag.message_detail})"
        else:
            # Fallback parsing
            error_str = str(exc.orig)
            if "DETAIL:" in error_str:
                detail_msg = " (" + error_str.split("DETAIL:")[1].split("\n")[0].strip() + ")"

        if "unique" in str(exc.orig).lower():
            message = f"Duplicate entry — this record already exists.{detail_msg}"
        elif "foreign key" in str(exc.orig).lower():
            message = f"Referenced record does not exist or invalid relationship.{detail_msg}"
            
        print(f"[ERROR] IntegrityError on {request.url.path}: {message}")
        return _error_response("DB_INTEGRITY_ERROR", message, status.HTTP_409_CONFLICT)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Unhandled exception: {type(exc).__name__}: {exc}")
        return _error_response(
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred. Please try again.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )