from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.suppliers.domain.models import Supplier
from pydantic import BaseModel
import json

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

class SupplierCreate(BaseModel):
    name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_method: str = "CASH"
    payment_details: dict = {} # Client sends dict, we store string

class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_method: str | None = None
    payment_details: dict | None = None

class SupplierRead(BaseModel):
    id: int
    name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_method: str | None = None
    payment_details: dict = {}

    class Config:
        from_attributes = True

@router.get("/", response_model=list[SupplierRead])
async def list_suppliers(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Supplier).offset(skip).limit(limit))
    suppliers = result.scalars().all()
    
    # Convert stored JSON string back to dict for response
    response = []
    for s in suppliers:
        details = {}
        if s.payment_details:
            try:
                details = json.loads(s.payment_details)
            except:
                details = {}
        
        response.append(SupplierRead(
            id=s.id,
            name=s.name,
            contact_name=s.contact_name,
            email=s.email,
            phone=s.phone,
            address=s.address,
            payment_method=s.payment_method,
            payment_details=details
        ))
    return response

@router.post("/", response_model=SupplierRead)
async def create_supplier(supplier: SupplierCreate, db: AsyncSession = Depends(get_db)):
    db_supplier = Supplier(
        name=supplier.name,
        contact_name=supplier.contact_name,
        email=supplier.email,
        phone=supplier.phone,
        address=supplier.address,
        payment_method=supplier.payment_method,
        payment_details=json.dumps(supplier.payment_details) # Store as string
    )
    db.add(db_supplier)
    await db.commit()
    await db.refresh(db_supplier)
    
    return SupplierRead(
        id=db_supplier.id,
        name=db_supplier.name,
        contact_name=db_supplier.contact_name,
        email=db_supplier.email,
        phone=db_supplier.phone,
        address=db_supplier.address,
        payment_method=db_supplier.payment_method,
        payment_details=supplier.payment_details
    )

@router.put("/{supplier_id}", response_model=SupplierRead)
async def update_supplier(supplier_id: int, supplier_update: SupplierUpdate, db: AsyncSession = Depends(get_db)):
    db_supplier = await db.get(Supplier, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_update.model_dump(exclude_unset=True)
    
    # helper for JSON
    if 'payment_details' in update_data:
        update_data['payment_details'] = json.dumps(update_data['payment_details'])
        
    for key, value in update_data.items():
        setattr(db_supplier, key, value)
        
    await db.commit()
    await db.refresh(db_supplier)
    
    details = {}
    if db_supplier.payment_details:
        try:
            details = json.loads(db_supplier.payment_details)
        except:
            details = {}

    return SupplierRead(
        id=db_supplier.id,
        name=db_supplier.name,
        contact_name=db_supplier.contact_name,
        email=db_supplier.email,
        phone=db_supplier.phone,
        address=db_supplier.address,
        payment_method=db_supplier.payment_method,
        payment_details=details
    )
