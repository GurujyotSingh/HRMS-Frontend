import asyncio
import os
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:Divyansh113@localhost:5432/university_hrm"

from sqlalchemy import text, select
from app.db.session import AsyncSessionLocal
from app.db.models.user import User
from app.db.models.address import UserAddress
from app.db.models.financial import UserFinancial
from app.db.models.employment import UserEmployment
from app.db.models.emergency_contact import UserEmergencyContact
from app.services.onboarding_service import create_onboarding_for_employee, get_onboarding_by_employee

async def main():
    async with AsyncSessionLocal() as db:
        # 1. Add column if not exists
        try:
            await db.execute(text("ALTER TABLE onboarding_tasks ADD COLUMN IF NOT EXISTS assigned_to VARCHAR DEFAULT 'EMPLOYEE'"))
            await db.commit()
            print("Successfully added/verified 'assigned_to' column.")
        except Exception as e:
            print(f"Failed to add column (it may already exist or DB is strict): {e}")

        # 2. Query all active users
        users_result = await db.execute(select(User).where(User.status == 'ACTIVE'))
        users = users_result.scalars().all()
        
        count = 0
        for user in users:
            existing = await get_onboarding_by_employee(db, user.id)
            if not existing:
                try:
                    await create_onboarding_for_employee(db, user.id, commit=False)
                    count += 1
                except Exception as e:
                    print(f"Failed to backfill {user.id}: {e}")
        
        if count > 0:
            await db.commit()
            print(f"Successfully backfilled {count} onboarding records.")
        else:
            print("No new onboarding records needed.")

if __name__ == "__main__":
    asyncio.run(main())
