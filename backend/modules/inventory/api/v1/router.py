from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.inventory.domain.models import Warehouse, StockMovement, Batch, StockMovementType
from modules.catalog.domain.models import Product
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/inventory", tags=["Inventory"])

class WarehouseCreate(BaseModel):
    name: str
    is_default: bool = False

class ReceiveStock(BaseModel):
    product_id: int
    warehouse_id: int
    qty: float
    expiry_date: datetime | None = None

from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole

@router.post("/warehouses", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def create_warehouse(warehouse: WarehouseCreate, db: AsyncSession = Depends(get_db)):
    db_wh = Warehouse(**warehouse.model_dump())
    db.add(db_wh)
    await db.commit()
    await db.refresh(db_wh)
    return db_wh

@router.post("/receive", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def receive_stock(data: ReceiveStock, db: AsyncSession = Depends(get_db)):
    # 1. Get Product to check flags checks
    product = await db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Create Batch if needed (simple logic for now: always create batch if provided or required)
    batch_id = None
    if product.is_batch_tracked or data.expiry_date:
        batch = Batch(
            product_id=data.product_id,
            sku=product.sku,
            expiry_date=data.expiry_date
        )
        db.add(batch)
        await db.flush() # Get ID
        batch_id = batch.id

    # 3. Create Movement
    movement = StockMovement(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        batch_id=batch_id,
        qty=data.qty,
        type=StockMovementType.IN.value
    )
    db.add(movement)
    
    await db.commit()
    return {"status": "received", "movement_id": movement.id}

from sqlalchemy import func, case

class StockLevel(BaseModel):
    product_id: int
    name: str
    sku: str
    quantity: float

@router.get("/stock", response_model=list[StockLevel])
async def get_stock_levels(db: AsyncSession = Depends(get_db)):
    # Calculate stock: IN + ADJUST (if pos) - OUT - COMMIT
    # Note: We assume ADJUST is strict. If ADJUST is signed in DB it's easier, but here we might need logic. 
    # For now, let's assuming ADJUST is strictly adding, and maybe we have ADJUST_OUT?
    # Simple version: Sum all movements where type IN, subtract OUT/COMMIT.
    
    # We need to Outer Join Product with Movements
    stmt = select(
        Product.id,
        Product.name,
        Product.sku,
        func.coalesce(func.sum(
            case(
                (StockMovement.type == "IN", StockMovement.qty),
                (StockMovement.type == "ADJUST", StockMovement.qty), # Assuming positive adjustment for now
                (StockMovement.type == "OUT", -StockMovement.qty),
                (StockMovement.type == "COMMIT", -StockMovement.qty),
                else_=0
            )
        ), 0).label("quantity")
    ).outerjoin(StockMovement, Product.id == StockMovement.product_id).group_by(Product.id)

    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        StockLevel(product_id=r.id, name=r.name, sku=r.sku, quantity=r.quantity)
        for r in rows
    ]

@router.get("/alerts/low-stock")
async def get_low_stock_alerts(db: AsyncSession = Depends(get_db)):
    """
    Returns products where current stock is below or equal to the minimum stock level.
    """
    # Reuse similar logic to check stock, but filter by min_stock_level
    stmt = select(
        Product.id,
        Product.name,
        Product.sku,
        Product.min_stock_level,
        func.coalesce(func.sum(
             case(
                (StockMovement.type == "IN", StockMovement.qty),
                (StockMovement.type == "ADJUST", StockMovement.qty), 
                (StockMovement.type == "OUT", -StockMovement.qty),
                (StockMovement.type == "COMMIT", -StockMovement.qty),
                else_=0
            )           
        ), 0).label("quantity")
    ).outerjoin(StockMovement, Product.id == StockMovement.product_id)\
     .group_by(Product.id)\
     .having(func.coalesce(func.sum(
             case(
                (StockMovement.type == "IN", StockMovement.qty),
                (StockMovement.type == "ADJUST", StockMovement.qty), 
                (StockMovement.type == "OUT", -StockMovement.qty),
                (StockMovement.type == "COMMIT", -StockMovement.qty),
                else_=0
            )           
        ), 0) <= Product.min_stock_level)

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {"product_id": r.id, "name": r.name, "sku": r.sku, "quantity": r.quantity, "min_level": r.min_stock_level}
        for r in rows
    ]
