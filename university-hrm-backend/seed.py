import asyncio
from datetime import date
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.role import Role, RoleEnum
from app.db.models.department import Department
from app.db.models.user import User
from app.db.models.employee import Employee
from app.db.models.leave import Leave
from app.db.models.leave_balance import LeaveBalance
from app.db.models.leave_policy import LeavePolicy
from app.db.models.attendance import Attendance
from app.db.models.payroll import SalaryStructure, Payslip
from app.db.models.onboarding import OnboardingTemplate, OnboardingRecord, OnboardingTask, OffboardingRecord, OffboardingTask
from app.services.leave_balance_service import seed_balances_for_employee
from app.services.onboarding_service import seed_onboarding_for_employee
from app.db.models.performance import AppraisalCycle, PerformanceGoal
from app.db.models.chat import ChatSession, ChatMessage
from app.db.models.audit_log import AuditLog
from app.core.security import get_password_hash

async def seed_data():
    async with AsyncSessionLocal() as db:
        print(" Starting University HRM Seed...")

        # 1. Roles
        for role_name in RoleEnum:
            existing = await db.execute(select(Role).where(Role.name == role_name))
            if not existing.scalar_one_or_none():
                role = Role(name=role_name)
                db.add(role)
                print(f" Role created: {role_name.value}")

        await db.commit()

        # 2. Departments
        departments = [
            {"name": "Computer Science", "description": "Engineering & Programming"},
            {"name": "Administration", "description": "University Management"},
            {"name": "Finance & Accounts", "description": "Accounts & Payroll"},
            {"name": "Information Technology", "description": "IT & Software Engineering"},
            {"name": "Business Administration", "description": "Electronics & Communication"},
        ]
       
        dept_map = {}
        for dept_data in departments:
            existing = await db.execute(select(Department).where(Department.name == dept_data["name"]))
            if not existing.scalar_one_or_none():
                dept = Department(**dept_data)
                db.add(dept)
                await db.commit()
                await db.refresh(dept)
                print(f" Department created: {dept_data['name']}")
            else:
                dept = (await db.execute(select(Department).where(Department.name == dept_data["name"]))).scalar_one()
            dept_map[dept_data["name"]] = dept.id

        # 3. Seed Base Leave Policies for all roles
        from app.db.models.enums import LeaveType
        for role_name in RoleEnum:
            for lt, default_days in [(LeaveType.CASUAL, 12), (LeaveType.SICK, 12), (LeaveType.EARNED, 15)]:
                existing_policy = await db.execute(
                    select(LeavePolicy).where(LeavePolicy.role_name == role_name.value, LeavePolicy.leave_type == lt)
                )
                if not existing_policy.scalar_one_or_none():
                    db.add(LeavePolicy(role_name=role_name.value, leave_type=lt, default_days=default_days))
        await db.commit()

        # 4. Users + Employees
        users_to_create = [
            {"email": "divyansh.admin@uni.edu", "password": "admin123", "role": RoleEnum.ADMIN, "first_name": "Divyansh", "last_name": "Sharma", "employee_id": "UNI-AD-001", "dept": "Administration"},
            {"email": "bhavya.hr@uni.edu", "password": "hr123", "role": RoleEnum.HR, "first_name": "Bhavya", "last_name": "Patel", "employee_id": "UNI-HR-001", "dept": "Administration"},
            {"email": "tanvi.finance@uni.edu", "password": "acc123", "role": RoleEnum.ACCOUNTANT, "first_name": "Tanvi", "last_name": "Desai", "employee_id": "UNI-AC-001", "dept": "Finance & Accounts"},
            {"email": "bhavin.cs@uni.edu", "password": "hod123", "role": RoleEnum.DEPARTMENT_HEAD, "first_name": "Dr. Bhavin", "last_name": "Shah", "employee_id": "UNI-HD-001", "dept": "Computer Science"},
            {"email": "neha.verma@uni.edu", "password": "emp123", "role": RoleEnum.EMPLOYEE, "first_name": "Neha", "last_name": "Verma", "employee_id": "UNI-EM-001", "dept": "Computer Science"},
            {"email": "rahul.nair@uni.edu", "password": "emp123", "role": RoleEnum.EMPLOYEE, "first_name": "Rahul", "last_name": "Nair", "employee_id": "UNI-EM-002", "dept": "Administration"},
            {"email": "priya.iyer@uni.edu", "password": "emp123", "role": RoleEnum.EMPLOYEE, "first_name": "Priya", "last_name": "Iyer", "employee_id": "UNI-EM-003", "dept": "Information Technology"},
            {"email": "kavita.rao@uni.edu", "password": "emp123", "role": RoleEnum.EMPLOYEE, "first_name": "Kavita", "last_name": "Rao", "employee_id": "UNI-EM-004", "dept": "Finance & Accounts"},
            {"email": "samir.joshi@uni.edu", "password": "emp123", "role": RoleEnum.EMPLOYEE, "first_name": "Samir", "last_name": "Joshi", "employee_id": "UNI-EM-005", "dept": "Business Administration"},
        ]
        default_joining_date = date(2024, 1, 1)

        for u in users_to_create:
            existing = await db.execute(select(User).where(User.email == u["email"]))
            user = existing.scalar_one_or_none()
            if user:
                print(f" User already exists: {u['email']}. Checking for balances/onboarding...")
                # Retroactively seed balances for existing demo users
                emp_existing = await db.execute(select(Employee).where(Employee.user_id == user.id))
                employee = emp_existing.scalar_one_or_none()
                if employee:
                    # Check if balance exists
                    bal_existing = await db.execute(select(LeaveBalance).where(LeaveBalance.employee_id == employee.id))
                    if not bal_existing.first():
                        await seed_balances_for_employee(db, employee.id, u["role"].value)
                    
                    # Check if onboarding exists
                    onb_existing = await db.execute(select(OnboardingRecord).where(OnboardingRecord.employee_id == employee.id))
                    if not onb_existing.first():
                        await seed_onboarding_for_employee(db, employee.id)
                continue

            role = (await db.execute(select(Role).where(Role.name == u["role"]))).scalar_one()

            user = User(
                email=u["email"],
                hashed_password=get_password_hash(u["password"]),
                role_id=role.id,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            employee = Employee(
                first_name=u["first_name"],
                last_name=u["last_name"],
                employee_id=u["employee_id"],
                date_of_joining=default_joining_date,
                department_id=dept_map[u["dept"]],
                user_id=user.id,
            )
            db.add(employee)
            await db.commit()
            await db.refresh(employee)

            await seed_balances_for_employee(db, employee.id, u["role"].value)
            await seed_onboarding_for_employee(db, employee.id)

            print(f" Created: {u['email']} ({u['role'].value})")

        print("\n SEED COMPLETED SUCCESSFULLY!")
        print("\nLogin Credentials:")
        print("• Admin      → divyansh.admin@uni.edu / admin123")
        print("• HR         → bhavya.hr@uni.edu / hr123")
        print("• Accountant → tanvi.finance@uni.edu / acc123")
        print("• HOD CS     → bhavin.cs@uni.edu / hod123")
        print("• Employee   → neha.verma@uni.edu / emp123")


if __name__ == "__main__":
    asyncio.run(seed_data())