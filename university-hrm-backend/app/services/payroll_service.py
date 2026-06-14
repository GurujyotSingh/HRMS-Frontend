import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import select, desc, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from app.db.models.payroll import PayrollRun, PayrollComponent, Payslip, PayrollApprovalHistory
from app.db.models.user import User
from app.schemas.payroll import PayrollRunCreate, PayrollRunUpdate, PayrollComponentCreate
from app.services.encryption_service import encrypt_value
from app.services.audit_service import audit, AuditAction


async def _create_history(db: AsyncSession, payroll_id: str, action: str, performed_by: str, remarks: Optional[str] = None):
    history = PayrollApprovalHistory(
        id=str(uuid.uuid4()),
        payroll_run_id=payroll_id,
        action=action,
        remarks=remarks,
        performed_by=performed_by,
        performed_at=datetime.utcnow()
    )
    db.add(history)


async def get_payroll(db: AsyncSession, payroll_id: str) -> Optional[PayrollRun]:
    result = await db.execute(
        select(PayrollRun)
        .options(selectinload(PayrollRun.components))
        .where(PayrollRun.id == payroll_id)
    )
    return result.scalar_one_or_none()


async def list_payrolls(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    employee_id: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
) -> tuple[List[PayrollRun], int]:
    query = select(PayrollRun).options(selectinload(PayrollRun.components))
    
    if employee_id:
        query = query.where(PayrollRun.employee_id == employee_id)
    if month:
        query = query.where(PayrollRun.payroll_month == month)
    if year:
        query = query.where(PayrollRun.payroll_year == year)
    if status:
        query = query.where(PayrollRun.status == status)
        
    count_query = select(func.count(PayrollRun.id)).select_from(query.subquery())
    total = await db.scalar(count_query) or 0
    
    query = query.order_by(PayrollRun.payroll_year.desc(), PayrollRun.payroll_month.desc(), PayrollRun.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()
    
    return list(items), total


async def create_payroll(
    db: AsyncSession, 
    data: PayrollRunCreate, 
    current_user: User,
    request: Request
) -> PayrollRun:
    # Check for duplicate
    existing = await db.scalar(
        select(PayrollRun).where(
            PayrollRun.employee_id == data.employee_id,
            PayrollRun.payroll_month == data.payroll_month,
            PayrollRun.payroll_year == data.payroll_year
        )
    )
    if existing:
        raise ValueError(f"A payroll record for this employee for {data.payroll_month}/{data.payroll_year} already exists.")
        
    run_id = str(uuid.uuid4())
    
    run = PayrollRun(
        id=run_id,
        employee_id=data.employee_id,
        payroll_month=data.payroll_month,
        payroll_year=data.payroll_year,
        gross_salary=encrypt_value(data.gross_salary),
        net_salary=encrypt_value(data.net_salary),
        total_earnings=encrypt_value(data.total_earnings),
        total_deductions=encrypt_value(data.total_deductions),
        remarks=data.remarks,
        status="Draft",
        created_by=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(run)
    await db.flush()
    
    for comp in data.components:
        db.add(PayrollComponent(
            id=str(uuid.uuid4()),
            payroll_run_id=run_id,
            component_name=comp.component_name,
            component_type=comp.component_type,
            amount=encrypt_value(comp.amount),
            created_at=datetime.utcnow()
        ))
        
    await _create_history(db, run_id, "CREATED", current_user.id, "Draft payroll created")
    
    # Audit log detail is now a string, because the DB schema was altered to TEXT to bypass asyncpg JSON bugs
    await audit(db, "PAYROLL_CREATED", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=run_id, detail="Payroll Draft Created", request=request)
    
    await db.commit()
    return await get_payroll(db, run_id)


async def update_payroll(
    db: AsyncSession,
    payroll_id: str,
    data: PayrollRunUpdate,
    current_user: User,
    request: Request
) -> Optional[PayrollRun]:
    run = await get_payroll(db, payroll_id)
    if not run:
        return None
        
    if data.gross_salary is not None: run.gross_salary = encrypt_value(data.gross_salary)
    if data.net_salary is not None: run.net_salary = encrypt_value(data.net_salary)
    if data.total_earnings is not None: run.total_earnings = encrypt_value(data.total_earnings)
    if data.total_deductions is not None: run.total_deductions = encrypt_value(data.total_deductions)
    if data.remarks is not None: run.remarks = data.remarks
    run.updated_at = datetime.utcnow()
    
    if data.components is not None:
        from sqlalchemy import delete
        await db.execute(delete(PayrollComponent).where(PayrollComponent.payroll_run_id == payroll_id))
        for comp in data.components:
            db.add(PayrollComponent(
                id=str(uuid.uuid4()),
                payroll_run_id=payroll_id,
                component_name=comp.component_name,
                component_type=comp.component_type,
                amount=encrypt_value(comp.amount),
                created_at=datetime.utcnow()
            ))
            
    await _create_history(db, payroll_id, "UPDATED", current_user.id, "Payroll updated")
    await audit(db, "PAYROLL_UPDATED", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=payroll_id, detail="Payroll Updated", request=request)
    
    await db.commit()
    return await get_payroll(db, payroll_id)


async def submit_payroll(db: AsyncSession, payroll_id: str, remarks: Optional[str], current_user: User, request: Request) -> Optional[PayrollRun]:
    run = await get_payroll(db, payroll_id)
    if not run or run.status != "Draft":
        raise ValueError("Only Draft payrolls can be submitted")
        
    run.status = "Pending_Finance_Review"
    run.updated_at = datetime.utcnow()
    
    await _create_history(db, payroll_id, "SUBMITTED", current_user.id, remarks or "Submitted to Finance/Accountant")
    await audit(db, "PAYROLL_UPDATED", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=payroll_id, detail="Submitted for Finance/Accountant Review", request=request)
    
    await db.commit()
    return run


async def approve_payroll(db: AsyncSession, payroll_id: str, remarks: Optional[str], current_user: User, request: Request) -> Optional[PayrollRun]:
    run = await get_payroll(db, payroll_id)
    if not run:
        return None
        
    user_role = (current_user.role or "").lower()
    is_hr = user_role in ["hr", "hr_manager", "hr_staff", "admin", "super_admin"]
    is_finance = user_role in ["finance", "accountant", "admin", "super_admin"]
        
    if run.status == "Pending_HR_Review":
        if not is_hr:
            raise ValueError("Only HR can approve this step")
        run.status = "Pending_Finance_Review"
        action = "HR_APPROVED"
        msg = remarks or "Approved by HR, sent to Finance"
    elif run.status == "Pending_Finance_Review":
        if not is_finance:
            raise ValueError("Only Finance can approve this step")
        run.status = "Approved"
        run.approved_by = current_user.id
        run.approved_at = datetime.utcnow()
        action = "FINANCE_APPROVED"
        msg = remarks or "Approved by Finance"
    else:
        raise ValueError(f"Cannot approve payroll in {run.status} state")
        
    run.updated_at = datetime.utcnow()
    
    await _create_history(db, payroll_id, action, current_user.id, msg)
    await audit(db, "PAYROLL_APPROVED", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=payroll_id, detail=msg, request=request)
    
    await db.commit()
    return run


async def reject_payroll(db: AsyncSession, payroll_id: str, remarks: Optional[str], current_user: User, request: Request) -> Optional[PayrollRun]:
    run = await get_payroll(db, payroll_id)
    if not run:
        return None
        
    run.status = "Rejected"
    run.updated_at = datetime.utcnow()
    
    await _create_history(db, payroll_id, "REJECTED", current_user.id, remarks or "Rejected")
    await audit(db, "PAYROLL_REJECTED", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=payroll_id, detail="Payroll Rejected", request=request)
    
    await db.commit()
    return run


async def mark_paid(db: AsyncSession, payroll_id: str, remarks: Optional[str], current_user: User, request: Request) -> Optional[PayrollRun]:
    run = await get_payroll(db, payroll_id)
    if not run or run.status != "Approved":
        raise ValueError("Only Approved payrolls can be marked as Paid")
        
    run.status = "Paid"
    run.updated_at = datetime.utcnow()
    
    await _create_history(db, payroll_id, "MARKED_PAID", current_user.id, remarks or "Marked as Paid")
    await audit(db, "PAYROLL_MARKED_PAID", user_id=current_user.id, user_email=current_user.email, resource="payroll", resource_id=payroll_id, detail="Marked as Paid", request=request)
    
    await db.commit()
    return run


async def generate_payslip(db: AsyncSession, payroll_id: str, current_user: User, request: Request) -> Payslip:
    # First get the payroll run
    result = await db.execute(select(PayrollRun).options(selectinload(PayrollRun.components), selectinload(PayrollRun.employee)).where(PayrollRun.id == payroll_id))
    run = result.scalar_one_or_none()
    if not run:
        raise ValueError("Payroll not found")
        
    # Check if payslip already generated
    result = await db.execute(select(Payslip).where(Payslip.payroll_run_id == payroll_id))
    existing = result.scalar_one_or_none()
    
    # Fetch creator name
    creator_name = "System"
    if run.created_by:
        creator_result = await db.execute(select(User).where(User.id == run.created_by))
        creator = creator_result.scalar_one_or_none()
        if creator:
            creator_name = f"{creator.first_name} {creator.last_name}"

    import os
    # Generate actual PDF file if it doesn't exist on disk
    from app.services.pdf_service import generate_payslip_pdf
    pdf_path = None
    if not existing or not existing.pdf_path or not os.path.exists(f"app{existing.pdf_path}"):
        pdf_path = generate_payslip_pdf(run, run.employee, creator_name=creator_name)
        
    if existing:
        if pdf_path:
            existing.pdf_path = pdf_path
            await db.commit()
        return existing
        
    payslip = Payslip(
        id=str(uuid.uuid4()),
        payroll_run_id=payroll_id,
        pdf_path=pdf_path,
        generated_at=datetime.utcnow(),
        downloaded_count=0
    )
    db.add(payslip)
    
    await audit(db, "PAYSLIP_GENERATED", user_id=current_user.id, user_email=current_user.email, resource="payslip", resource_id=payslip.id, detail="Payslip metadata generated", request=request)
    
    await db.commit()
    await db.refresh(payslip)
    return payslip
