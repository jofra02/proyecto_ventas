from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.catalog.domain.models import Product
from pydantic import BaseModel

router = APIRouter(prefix="/products", tags=["Catalog"])

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: str | None = None
    price: float = 0.0
    track_expiry: bool = False
    is_batch_tracked: bool = False

class BarcodeRead(BaseModel):
    barcode: str
    class Config:
        from_attributes = True

class ProductRead(ProductCreate):
    id: int
    barcodes: list[BarcodeRead] = []

    class Config:
        from_attributes = True

from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole

@router.post("/", response_model=ProductRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    try:
        await db.commit()
        await db.refresh(db_product)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Product usually already exists")
    return db_product

@router.get("/", response_model=list[ProductRead])
async def list_products(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).offset(skip).limit(limit))
    return result.scalars().all()

from modules.catalog.domain.models import ProductBarcode

class BarcodeCreate(BaseModel):
    barcode: str

@router.post("/{product_id}/barcodes", response_model=BarcodeCreate)
async def add_barcode(product_id: int, data: BarcodeCreate, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if barcode exists
    existing = await db.execute(select(ProductBarcode).where(ProductBarcode.barcode == data.barcode))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Barcode already assigned")

    new_barcode = ProductBarcode(product_id=product_id, barcode=data.barcode)
    db.add(new_barcode)
    await db.commit()
    return data
