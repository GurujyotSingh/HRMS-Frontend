import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://localhost:8000/api/v1/onboarding/offboarding/initiate",
            json={
                "employee_id": "123",
                "reason": "test",
                "last_working_date": "",
                "tasks": []
            }
        )
        print("Status:", res.status_code)
        print("Body:", res.text)

if __name__ == "__main__":
    asyncio.run(test())
