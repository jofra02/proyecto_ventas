from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.customers.domain.models import Customer
from pydantic import BaseModel

router = APIRouter(prefix="/customers", tags=["Customers"])

class CustomerCreate(BaseModel):
    name: str
    tax_id: str | None = None
    email: str | None = None

class CustomerRead(CustomerCreate):
    id: int

from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole

@router.post("/", response_model=CustomerRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def create_customer(data: CustomerCreate, db: AsyncSession = Depends(get_db)):
    customer = Customer(**data.model_dump())
    db.add(customer)
    try:
        await db.commit()
        await db.refresh(customer)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Customer usually already exists")
    return customer

@router.get("/", response_model=list[CustomerRead])
async def list_customers(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Customer).offset(skip).limit(limit))
    return result.scalars().all()

@router.put("/{customer_id}", response_model=CustomerRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def update_customer(customer_id: int, data: CustomerCreate, db: AsyncSession = Depends(get_db)):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in data.model_dump().items():
        setattr(customer, key, value)
    
    await db.commit()
    await db.refresh(customer)
    return customer

from datetime import datetime, timedelta
from sqlalchemy import func

@router.get("/analytics/summary")
async def get_customer_analytics(
    days: int | None = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns total customers and new customers in the last N days (with trend).
    """
    # 1. Total Customers
    total_stmt = select(func.count(Customer.id))
    total_customers = (await db.execute(total_stmt)).scalar() or 0

    # 2. New Customers (Current Period)
    lookback = days if days else 7
    cutoff_date = datetime.utcnow() - timedelta(days=lookback)
    
    new_stmt = select(func.count(Customer.id)).where(Customer.created_at >= cutoff_date)
    new_customers = (await db.execute(new_stmt)).scalar() or 0

    # 3. New Customers (Previous Period)
    prev_cutoff = cutoff_date - timedelta(days=lookback)
    prev_stmt = select(func.count(Customer.id)).where(
        Customer.created_at >= prev_cutoff,
        Customer.created_at < cutoff_date
    )
    prev_new_customers = (await db.execute(prev_stmt)).scalar() or 0

    # 4. Calculate Trend
    trend = 0.0
    if prev_new_customers == 0:
        trend = 100.0 if new_customers > 0 else 0.0
    else:
        trend = ((new_customers - prev_new_customers) / prev_new_customers) * 100.0

    return {
        "total_customers": total_customers,
        "new_customers": new_customers,
        "new_customers_trend": trend
    }
