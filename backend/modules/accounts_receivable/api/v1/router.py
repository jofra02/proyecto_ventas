from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.database import get_db
from modules.accounts_receivable.domain.models import CustomerLedger
from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/accounts-receivable", tags=["Accounts Receivable"])

class LedgerEntryRead(BaseModel):
    id: int
    customer_id: int
    amount: float
    type: str
    reference_id: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/{customer_id}/ledger", response_model=list[LedgerEntryRead], dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def get_ledger(customer_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(CustomerLedger).where(CustomerLedger.customer_id == customer_id).order_by(CustomerLedger.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{customer_id}/balance", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def get_balance(customer_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(func.sum(CustomerLedger.amount)).where(CustomerLedger.customer_id == customer_id)
    result = await db.execute(stmt)
    balance = result.scalar() or 0.0
    return {"customer_id": customer_id, "balance": balance}
