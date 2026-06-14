import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if user:
            print("USER:", user.email)
            print("EMPLOYMENT:", user.employment)
            if user.employment:
                print("EMPLOYMENT DEPT:", user.employment.department_id)
                print("EMPLOYMENT DESIG:", user.employment.designation)
        else:
            print("No users found")

if __name__ == "__main__":
    asyncio.run(main())
