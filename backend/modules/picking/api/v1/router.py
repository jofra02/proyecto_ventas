from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from core.database import get_db
from modules.picking.domain.models import PickTask, PickScanEvent, PickTaskStatus
from modules.sales.domain.models import Sale, SaleStatus
from modules.catalog.domain.models import Product, ProductBarcode
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/picking", tags=["Picking"])

class PickTaskRead(BaseModel):
    id: int
    sale_id: int
    status: str
    scan_count: int = 0 # Simplified

@router.post("/tasks", response_model=PickTaskRead)
async def create_pick_task(sale_id: int, db: AsyncSession = Depends(get_db)):
    # Check if sale exists and is confirmed
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status != SaleStatus.CONFIRMED.value:
        raise HTTPException(status_code=400, detail="Sale must be CONFIRMED to start picking")

    # Check if task already exists
    existing = await db.execute(select(PickTask).where(PickTask.sale_id == sale_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Picking task already exists for this sale")

    task = PickTask(sale_id=sale_id, status=PickTaskStatus.PENDING.value)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    
    return {"id": task.id, "sale_id": task.sale_id, "status": task.status, "scan_count": 0}

class ScanRequest(BaseModel):
    task_id: int
    barcode: str

class ScanResponse(BaseModel):
    status: str # MATCH, MISMATCH, NOT_FOUND
    product_name: str | None = None
    scanned_qty: int
    required_qty: int

@router.post("/scan", response_model=ScanResponse)
async def register_scan(data: ScanRequest, db: AsyncSession = Depends(get_db)):
    task = await db.get(PickTask, data.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Pick task not found")
    
    # 1. Lookup Barcode
    barcode_entry = await db.execute(select(ProductBarcode).where(ProductBarcode.barcode == data.barcode))
    barcode_row = barcode_entry.scalar_one_or_none()
    
    if not barcode_row:
        return {"status": "NOT_FOUND", "scanned_qty": 0, "required_qty": 0}
    
    product = await db.get(Product, barcode_row.product_id)
    
    # 2. Check if product is in Sale
    sale = await db.get(Sale, task.sale_id)
    # Lazy load items if needed (already configured joined usually)
    
    target_item = next((item for item in sale.items if item.product_id == product.id), None)
    
    if not target_item:
        return {"status": "MISMATCH", "product_name": product.name, "scanned_qty": 0, "required_qty": 0}

    # 3. Register Scan Event
    event = PickScanEvent(
        task_id=task.id,
        barcode_scanned=data.barcode,
        product_id=product.id
    )
    db.add(event)
    
    # Update Task Status
    if task.status == PickTaskStatus.PENDING.value:
        task.status = PickTaskStatus.IN_PROGRESS.value
    
    await db.commit()
    
    # 4. Calculate Progress
    # Count how many times this product has been scanned in this task
    scan_count_res = await db.execute(
        select(func.count(PickScanEvent.id))
        .where(PickScanEvent.task_id == task.id)
        .where(PickScanEvent.product_id == product.id)
    )
    scanned_qty = scan_count_res.scalar()

    return {
        "status": "MATCH",
        "product_name": product.name,
        "scanned_qty": scanned_qty,
        "required_qty": int(target_item.qty)
    }
