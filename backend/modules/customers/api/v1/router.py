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
