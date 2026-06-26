import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.db.session import AsyncSessionLocal
from app.services.onboarding_service import get_all_offboarding_records
from app.api.v1.onboarding import OffboardingOut

async def test():
    async with AsyncSessionLocal() as db:
        try:
            records = await get_all_offboarding_records(db)
            print(f"Found {len(records)} records")
            for r in records:
                out = OffboardingOut.model_validate(r)
                print(out.id)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
