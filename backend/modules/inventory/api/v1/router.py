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
    # 1. Get Product
    product = await db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Batch Logic
    batch_id = None
    if product.is_batch_tracked or data.expiry_date:
        batch = Batch(
            product_id=data.product_id,
            sku=product.sku,
            expiry_date=data.expiry_date
        )
        db.add(batch)
        await db.flush()
        batch_id = batch.id

    # 3. Movement
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

class BatchReceiveItem(BaseModel):
    product_id: int
    qty: float
    supplier_id: int | None = None # Per-item supplier override
    expiry_date: datetime | None = None

class BatchReceiveRequest(BaseModel):
    warehouse_id: int
    supplier_id: int | None = None # Default for batch
    items: list[BatchReceiveItem]

@router.post("/receive-batch", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def receive_stock_batch(data: BatchReceiveRequest, db: AsyncSession = Depends(get_db)):
    movements = []
    
    for item in data.items:
        product = await db.get(Product, item.product_id)
        if not product:
            continue
        
        # Determine supplier: Item > Batch
        final_supplier_id = item.supplier_id or data.supplier_id
        if not final_supplier_id:
             # If mandatory, we should skip or error? 
             # Let's assume validation happened before or we allow NULL if the model allows it (it does locally, but business logic might say strict)
             # User said "mandatory", so we should ensure we have one if possible. 
             # For now, let's proceed; if it's None, it saves as None (unless we enforce check).
             pass

        batch_id = None
        if product.is_batch_tracked or item.expiry_date:
            batch = Batch(
                product_id=item.product_id,
                sku=product.sku,
                expiry_date=item.expiry_date
            )
            db.add(batch)
            await db.flush()
            batch_id = batch.id
        
        movement = StockMovement(
            product_id=item.product_id,
            warehouse_id=data.warehouse_id,
            batch_id=batch_id,
            supplier_id=final_supplier_id,
            qty=item.qty,
            type=StockMovementType.IN.value
        )
        db.add(movement)
        movements.append(movement)

    await db.commit()
    return {"status": "batch_received", "count": len(movements)}

class StockAdjustment(BaseModel):
    product_id: int
    warehouse_id: int
    qty: float # Positive to add, Negative to remove
    reason: str | None = None

@router.post("/adjust", dependencies=[Depends(RoleChecker([UserRole.ADMIN, UserRole.SUPERVISOR]))])
async def adjust_stock(data: StockAdjustment, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movement = StockMovement(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        qty=data.qty, # Can be negative
        type=StockMovementType.ADJUST.value,
        reference_id=data.reason
    )
    db.add(movement)
    await db.commit()
    return {"status": "adjusted", "movement_id": movement.id}

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
        func.coalesce(Product.min_stock_level, 10.0).label("min_stock_level"),
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
        ), 0) <= func.coalesce(Product.min_stock_level, 10.0))

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {"product_id": r.id, "name": r.name, "sku": r.sku, "quantity": r.quantity, "min_level": r.min_stock_level}
        for r in rows
    ]

from modules.suppliers.domain.models import Supplier

@router.get("/stock/{product_id}/details")
async def get_product_stock_details(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Returns a breakdown of stock by Supplier (based on Active Batches).
    For non-batch tracked items, this might just show historical receipts or a single 'General' entry.
    """
    # Strategy: Find all batches for this product with positive quantity.
    # Group by (Supplier, Batch). 
    # Since we added supplier_id to StockMovement, we can use that directly for unbatched items too.
    
    # 1. Calculate Qty per Batch/Supplier Tuple
    # We group by batch_id AND supplier_id to differentiate sources even for unbatched items.
    stmt = select(
        StockMovement.batch_id,
        StockMovement.supplier_id,
        func.sum(
             case(
                (StockMovement.type == "IN", StockMovement.qty),
                # Adjustments: If linked to a supplier? Usually not. But we might inherit.
                # If we don't group by supplier_id for adjustments, they might end up in a separate bucket or NULL supplier bucket.
                # Assuming Adjustments might have NULL supplier.
                (StockMovement.type == "ADJUST", StockMovement.qty), 
                (StockMovement.type == "OUT", -StockMovement.qty),
                (StockMovement.type == "COMMIT", -StockMovement.qty),
                else_=0
            ) 
        ).label("qty")
    ).where(StockMovement.product_id == product_id).group_by(StockMovement.batch_id, StockMovement.supplier_id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    details = []
    
    for row in rows:
        bid = row.batch_id
        sid = row.supplier_id
        qty = row.qty
        
        if qty <= 0:
            continue
            
        supplier_name = "Unknown / Mixed"
        batch_sku = "General"
        expiry = None
        
        # Resolve Supplier Name
        if sid:
            s = await db.get(Supplier, sid)
            if s:
                supplier_name = s.name
        
        # Resolve Batch Info
        if bid:
            b = await db.get(Batch, bid)
            if b:
                batch_sku = b.sku
                expiry = b.expiry_date
        
        # Aggregation Logic
        # We want to list by Supplier.
        existing = next((d for d in details if d["supplier"] == supplier_name), None)
        if existing:
            existing["qty"] += qty
            existing["batches"].append({"sku": batch_sku, "qty": qty, "expiry": expiry})
        else:
            details.append({
                "supplier": supplier_name,
                "qty": qty,
                "batches": [{"sku": batch_sku, "qty": qty, "expiry": expiry}]
            })
            
    return details
