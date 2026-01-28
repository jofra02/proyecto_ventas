from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.finance.domain.models import CostCategory, CostCalculationType, Payment
from pydantic import BaseModel
from typing import List
from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole
from modules.accounts_receivable.application.service import AccountService
from modules.customers.domain.models import Customer

router = APIRouter(prefix="/finance", tags=["Finance"])

class CostCategoryCreate(BaseModel):
    name: str
    description: str | None = None
    default_type: CostCalculationType = CostCalculationType.FIXED_AMOUNT

class CostCategoryRead(CostCategoryCreate):
    id: int
    is_active: bool
    class Config:
        from_attributes = True

@router.post("/categories/", response_model=CostCategoryRead)
async def create_category(category: CostCategoryCreate, db: AsyncSession = Depends(get_db)):
    db_cat = CostCategory(
        name=category.name,
        description=category.description,
        default_type=category.default_type
    )
    db.add(db_cat)
    await db.commit()
    await db.refresh(db_cat)
    return db_cat

@router.get("/categories/", response_model=List[CostCategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CostCategory).where(CostCategory.is_active == True))
    return result.scalars().all()

# --- Payments Section ---

class PaymentCreate(BaseModel):
    customer_id: int | None = None
    amount: float
    method: str = "cash"
    idempotency_key: str | None = None

@router.post("/payments/", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def create_payment(data: PaymentCreate, db: AsyncSession = Depends(get_db)):
    # 1. Check Idempotency (Simple check)
    if data.idempotency_key:
        existing = await db.execute(select(Payment).where(Payment.idempotency_key == data.idempotency_key))
        if existing.scalar_one_or_none():
             raise HTTPException(status_code=409, detail="Payment already processed (Idempotency Key)")

    # 2. Check Customer (Only if provided)
    if data.customer_id:
        customer = await db.get(Customer, data.customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    # 3. Create Payment
    payment = Payment(**data.model_dump())
    db.add(payment)
    await db.flush()

    # 4. Post to Ledger (Only if customer is present)
    if payment.customer_id:
        account_service = AccountService(db)
        await account_service.posting_payment(
            customer_id=payment.customer_id,
            amount=payment.amount,
            payment_id=payment.id
        )

    await db.commit()
    await db.refresh(payment)
    return payment

@router.get("/payments/", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def list_payments(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(Payment).order_by(Payment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
