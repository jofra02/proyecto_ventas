from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.catalog.domain.models import Product, ProductBarcode
from modules.suppliers.domain.models import Supplier
from modules.iam.api.v1.router import RoleChecker, get_current_user
from modules.iam.domain.models import User, UserRole
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/products", tags=["Catalog"])

class ProductCreate(BaseModel):
    name: str
    sku: str
    description: str | None = None
    price: float = 0.0
    cost_price: float | None = 0.0
    # Decoupled costs
    cost_components: List[dict] = [] # List of {category_id: int, value: float}
    
    track_expiry: bool = False
    is_batch_tracked: bool = False
    min_stock_level: float | None = 10.0
    unit_of_measure: str | None = "unit"
    product_type: str | None = "unitary"
    measurement_value: float | None = None
    measurement_unit: str | None = None
    supplier_ids: List[int] = []

class BarcodeRead(BaseModel):
    barcode: str
    class Config:
        from_attributes = True

class SupplierRead(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class CostCategoryRead(BaseModel):
    id: int
    name: str
    default_type: str
    class Config:
        from_attributes = True

class CostComponentRead(BaseModel):
    id: int
    cost_category_id: int
    value: float
    category: Optional[CostCategoryRead] = None
    class Config:
        from_attributes = True

class ProductRead(ProductCreate):
    id: int
    barcodes: list[BarcodeRead] = []
    suppliers: list[SupplierRead] = []
    cost_components: list[CostComponentRead] = []

    class Config:
        from_attributes = True

@router.post("/", response_model=ProductRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    data = product.model_dump()
    supplier_ids = data.pop("supplier_ids", [])
    cost_components_data = data.pop("cost_components", [])
    
    db_product = Product(**data)
    
    if supplier_ids:
        stmt = select(Supplier).where(Supplier.id.in_(supplier_ids))
        result = await db.execute(stmt)
        suppliers = result.scalars().all()
        db_product.suppliers = list(suppliers)

    db.add(db_product)
    await db.flush() # Get ID

    # Save Cost Components
    from modules.finance.domain.models import ProductCostComponent
    for comp in cost_components_data:
        db.add(ProductCostComponent(
            product_id=db_product.id,
            cost_category_id=comp['category_id'],
            value=comp['value']
        ))
    
    db.add(db_product)
    try:
        await db.commit()
        await db.refresh(db_product)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Product usually already exists or duplicate SKU")
    return db_product

@router.get("/", response_model=list[ProductRead])
async def list_products(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Need to load suppliers eagerly? lazy='selectin' in model handles it.
    result = await db.execute(select(Product).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductRead, dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def update_product(product_id: int, product_data: ProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    data = product_data.model_dump()
    supplier_ids = data.pop("supplier_ids", None) # Optional update

    for key, value in data.items():
        setattr(db_product, key, value)
    
    if supplier_ids is not None:
        stmt = select(Supplier).where(Supplier.id.in_(supplier_ids))
        result = await db.execute(stmt)
        suppliers = result.scalars().all()
        db_product.suppliers = list(suppliers)
    
    try:
        await db.commit()
        await db.refresh(db_product)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Error updating product. Check for duplicate SKU.")
    
    return db_product

@router.delete("/{product_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    db_product = await db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.delete(db_product)
    await db.commit()
    return {"message": "Product deleted successfully"}

class BarcodeCreate(BaseModel):
    barcode: str

@router.post("/{product_id}/barcodes", response_model=BarcodeCreate)
async def add_barcode(product_id: int, data: BarcodeCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
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
