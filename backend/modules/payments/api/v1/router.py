from fastapi import APIRouter, Depends, HTTPException
from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.payments.domain.models import Payment
from modules.accounts_receivable.application.service import AccountService
from modules.customers.domain.models import Customer
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    customer_id: int
    amount: float
    method: str = "cash"
    idempotency_key: str | None = None

@router.post("/", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def create_payment(data: PaymentCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check Idempotency (Simple check)
    if data.idempotency_key:
        existing = await db.execute(select(Payment).where(Payment.idempotency_key == data.idempotency_key))
        if existing.scalar_one_or_none():
             raise HTTPException(status_code=409, detail="Payment already processed (Idempotency Key)")

    # 2. Check Customer
    customer = await db.get(Customer, data.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 3. Create Payment
    payment = Payment(**data.model_dump())
    db.add(payment)
    await db.flush()

    # 4. Post to Ledger (Account Credit)
    account_service = AccountService(db)
    await account_service.posting_payment(
        customer_id=payment.customer_id,
        amount=payment.amount,
        payment_id=payment.id
    )

    await db.commit()
    await db.commit()
    await db.refresh(payment)
    return payment

@router.get("/", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def list_payments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(Payment).order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
