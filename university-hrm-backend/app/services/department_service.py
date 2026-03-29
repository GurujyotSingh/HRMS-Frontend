from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.department import Department
from app.schemas.department import DepartmentCreate

async def create_department(db: AsyncSession, dept_in: DepartmentCreate):
    dept = Department(**dept_in.model_dump())
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept

async def get_departments(db: AsyncSession):
    result = await db.execute(select(Department))
    return result.scalars().all()