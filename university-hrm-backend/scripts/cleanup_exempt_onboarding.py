import asyncio
import sys
import os

# Add the project root to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from sqlalchemy import select, delete
from app.db.models.user import User
from app.db.models.onboarding import OnboardingEmployee, OnboardingTask

async def cleanup_exempt_onboarding():
    async with AsyncSessionLocal() as db:
        print("Starting cleanup of exempt onboarding records...")
        
        # ONBOARDING_REQUIRED_ROLES
        required_roles = ["DIRECTOR", "FACULTY", "STAFF", "ACCOUNTANT"]
        
        # Find all users NOT in required roles who have onboarding records
        # Ex: SUPER_ADMIN, HR_MANAGER, HR_STAFF (if HR_STAFF is exempt)
        # Note: We will specifically target SUPER_ADMIN, HR_MANAGER, HR_STAFF
        
        exempt_roles = ["SUPER_ADMIN", "HR_MANAGER", "HR_STAFF"]
        
        exempt_users_result = await db.execute(select(User).where(User.role.in_(exempt_roles)))
        exempt_users = exempt_users_result.scalars().all()
        
        if not exempt_users:
            print("No exempt users found in the system.")
            return

        exempt_user_ids = [u.id for u in exempt_users]
        
        # Find all onboarding records for these users
        records_result = await db.execute(select(OnboardingEmployee).where(OnboardingEmployee.employee_id.in_(exempt_user_ids)))
        records = records_result.scalars().all()
        
        if not records:
            print("No onboarding records found for exempt users. Already clean.")
            return
            
        record_ids = [r.id for r in records]
        
        # Delete tasks associated with these records
        print(f"Found {len(records)} onboarding records for exempt users. Deleting associated tasks...")
        await db.execute(delete(OnboardingTask).where(OnboardingTask.onboarding_record_id.in_(record_ids)))
        
        # Delete the records themselves
        print("Deleting onboarding records...")
        await db.execute(delete(OnboardingEmployee).where(OnboardingEmployee.id.in_(record_ids)))
        
        await db.commit()
        print(f"Successfully cleaned up onboarding data for {len(records)} exempt users.")

if __name__ == "__main__":
    asyncio.run(cleanup_exempt_onboarding())
