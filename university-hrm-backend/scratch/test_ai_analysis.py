import asyncio
import json
from dotenv import load_dotenv
load_dotenv()

from app.db.session import AsyncSessionLocal
from app.services.onboarding_service import analyze_exit_interview
from app.db.models.onboarding import OffboardingRecord
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Find an offboarding record
        result = await db.execute(select(OffboardingRecord))
        records = result.scalars().all()
        if not records:
            print("No offboarding records found.")
            return
            
        record = records[0]
        print(f"Testing with record: {record.id}")
        
        # Give it some dummy notes
        record.exit_interview_notes = "I enjoyed my time here, but ultimately the salary was 20% below market average, and my manager rarely gave me opportunities to lead projects. I'm moving to a tech startup."
        await db.commit()
        
        try:
            res = await analyze_exit_interview(db, record.id)
            print("Analysis Result:")
            print(json.dumps(res, indent=2))
        except Exception as e:
            print(f"Error during analysis: {e}")

if __name__ == "__main__":
    asyncio.run(main())
