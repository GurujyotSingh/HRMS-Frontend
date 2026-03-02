from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db

# Auth router (now safe to import)
from app.api.v1.auth import router as auth_router
from app.api.v1.employees import router as employees_router   # ← ADD THIS


app = FastAPI(
    title="University HRM System API",
    description="Backend for University HRM",
    version="0.1.0",
)

@app.get("/")
def root():
    return {"message": "University HRM System Backend is LIVE! 🚀 Welcome Divyansh!"}

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

# Mount all routers
app.include_router(auth_router, prefix="/api/v1")