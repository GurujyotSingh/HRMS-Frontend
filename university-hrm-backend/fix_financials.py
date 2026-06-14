import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.db.models.user import User
from app.db.models.financial import UserFinancial, BankBranch
from app.db.models.address import UserAddress
from app.db.models.employment import UserEmployment
from app.db.models.emergency_contact import UserEmergencyContact
import random

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User))
        users = res.scalars().all()
        
        # Create a dummy bank branch
        branch_res = await db.execute(select(BankBranch).where(BankBranch.ifsc_code == 'HDFC0001234'))
        branch = branch_res.scalar_one_or_none()
        if not branch:
            branch = BankBranch(ifsc_code='HDFC0001234', bank_name='HDFC Bank')
            db.add(branch)
            await db.commit()
            
        for u in users:
            fin_res = await db.execute(select(UserFinancial).where(UserFinancial.user_id == u.id))
            fin = fin_res.scalar_one_or_none()
            
            if not fin:
                new_fin = UserFinancial(
                    user_id=u.id,
                    pan_number=f"ABCDE{random.randint(1000, 9999)}F",
                    uan_number=str(random.randint(100000000000, 999999999999)),
                    bank_account_number=str(random.randint(1000000000, 9999999999)),
                    ifsc_code='HDFC0001234'
                )
                db.add(new_fin)
                
            if not u.phone:
                u.phone = f"+9198{random.randint(10000000, 99999999)}"
            if not u.gender:
                u.gender = random.choice(['MALE', 'FEMALE'])
                
        await db.commit()
        print('Generated financial details and phone numbers for all users!')

if __name__ == "__main__":
    asyncio.run(main())
