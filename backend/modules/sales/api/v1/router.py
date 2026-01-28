from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.sales.domain.models import Sale, SaleItem, SaleStatus
from modules.inventory.application.service import StockService
from modules.iam.api.v1.router import get_current_user
from modules.iam.domain.models import User
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/sales", tags=["Sales"])

class SaleItemCreate(BaseModel):
    product_id: int
    qty: float
    price: float

class SaleCreate(BaseModel):
    warehouse_id: int
    customer_id: int | None = None
    items: List[SaleItemCreate] = []

class SaleRead(BaseModel):
    id: int
    status: str
    warehouse_id: int
    customer_id: int | None
    items: List[SaleItemCreate] # Simplified for response

    class Config:
        from_attributes = True

@router.post("/", response_model=SaleRead)
async def create_sale(data: SaleCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    sale = Sale(
        warehouse_id=data.warehouse_id, 
        customer_id=data.customer_id,
        status=SaleStatus.DRAFT.value
    )
    db.add(sale)
    await db.flush()

    for item in data.items:
        db_item = SaleItem(sale_id=sale.id, **item.model_dump())
        db.add(db_item)
    
    await db.commit()
    await db.refresh(sale)
    return sale

@router.post("/{sale_id}/confirm")
async def confirm_sale(sale_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    sale = await db.get(Sale, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    if sale.status != SaleStatus.DRAFT.value:
        raise HTTPException(status_code=400, detail="Sale can only be confirmed from DRAFT")

    # Reserve Stock using Inventory Service
    stock_service = StockService(db)
    for item in sale.items:
        # Note: In a real system, we'd check availability first
        await stock_service.reserve_stock(
            product_id=item.product_id,
            warehouse_id=sale.warehouse_id,
            qty=item.qty,
            reference_id=f"SALE-{sale.id}"
        )
    
    sale.status = SaleStatus.CONFIRMED.value
    await db.commit()
    await db.refresh(sale)
    sale.status = SaleStatus.CONFIRMED.value
    await db.commit()
    await db.refresh(sale)
    return {"status": SaleStatus.CONFIRMED.value, "sale_id": sale.id}

from sqlalchemy.orm import selectinload

@router.get("/", response_model=List[SaleRead])
async def list_sales(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Include items for now, though normally we might omit them in list view for performance
    # But for a simple POS list, showing items is fine or we can use a simpler Read model
    stmt = select(Sale).options(selectinload(Sale.items)).offset(skip).limit(limit).order_by(Sale.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{sale_id}")
async def get_sale(sale_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Sale).options(selectinload(Sale.items)).where(Sale.id == sale_id)
    result = await db.execute(stmt)
    sale = result.scalar_one_or_none()
    
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # We might want to fetch product names manually if not relation exists, 
    # but let's assume the frontend will map Product IDs or we join here.
    # For MVP, returning items (product_id) is enough, frontend has product list cache or can fetch.
    return sale

# --- Analytics Endpoints ---

from sqlalchemy import func, desc

from datetime import datetime, timedelta

@router.get("/analytics/summary")
async def get_sales_summary(
    start_date: datetime | None = None, 
    end_date: datetime | None = None, 
    days: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns total revenue, total orders, and average order value.
    Accepts explicit Date Range OR 'days' (Lookback).
    """
    # Calculate cutoff
    if start_date and end_date:
        # Explicit range
        cutoff_start = start_date
        cutoff_end = end_date
    else:
        # Default lookback
        lookback = days if days else 7
        cutoff_end = datetime.utcnow()
        cutoff_start = cutoff_end - timedelta(days=lookback)

    # --- Helper Inner Function ---
    async def get_period_stats(start, end):
        # Revenue
        revenue_stmt = (
            select(func.sum(SaleItem.qty * SaleItem.price))
            .join(Sale)
            .where(
                Sale.status == SaleStatus.CONFIRMED.value,
                Sale.created_at >= start,
                Sale.created_at <= end
            )
        )
        period_revenue = (await db.execute(revenue_stmt)).scalar() or 0.0

        # Orders
        count_stmt = (
            select(func.count(Sale.id))
            .where(
                Sale.status == SaleStatus.CONFIRMED.value,
                Sale.created_at >= start,
                Sale.created_at <= end
            )
        )
        period_orders = (await db.execute(count_stmt)).scalar() or 0
        
        return period_revenue, period_orders

    # 1. Current Period
    current_revenue, current_orders = await get_period_stats(cutoff_start, cutoff_end)
    current_avg_order = current_revenue / current_orders if current_orders > 0 else 0.0

    # 2. Previous Period (Same duration before cutoff_start)
    duration = cutoff_end - cutoff_start
    prev_end = cutoff_start
    prev_start = prev_end - duration
    
    prev_revenue, prev_orders = await get_period_stats(prev_start, prev_end)
    prev_avg_order = prev_revenue / prev_orders if prev_orders > 0 else 0.0

    # 3. Calculate Trends (Percentage Change)
    def calc_trend(current, previous):
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100.0

    return {
        "total_revenue": current_revenue,
        "total_orders": current_orders,
        "avg_order_value": current_avg_order,
        "revenue_trend": calc_trend(current_revenue, prev_revenue),
        "orders_trend": calc_trend(current_orders, prev_orders),
        "avg_order_trend": calc_trend(current_avg_order, prev_avg_order)
    }

from modules.sales.application.analytics_service import SalesAnalyticsService

@router.get("/analytics/trend")
async def get_sales_trend(
    start_date: datetime | None = None, 
    end_date: datetime | None = None, 
    days: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SalesAnalyticsService(db)
    # Service logic now expects dates. If 'days' passed, convert here or in service.
    # Service implementation we just wrote handles default None logic by checking 'days', 
    # BUT wait, the service I wrote handles None/None by defaulting to 7 days.
    # It does NOT take a 'days' param anymore.
    
    if not start_date and days:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
    return await service.get_sales_trend(start_date, end_date)

@router.get("/analytics/top-products")
async def get_top_products(
    start_date: datetime | None = None, 
    end_date: datetime | None = None, 
    days: int | None = None,
    limit: int = 5, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns top selling products by quantity.
    """
    from modules.catalog.domain.models import Product
    
    if start_date and end_date:
        cutoff_start = start_date
        cutoff_end = end_date
    else:
        lookback = days if days else 7
        cutoff_end = datetime.utcnow()
        cutoff_start = cutoff_end - timedelta(days=lookback)

    # Group by product_id, sum qty
    stmt = (
        select(SaleItem.product_id, Product.name, func.sum(SaleItem.qty).label("total_sold"), func.sum(SaleItem.qty * SaleItem.price).label("revenue"))
        .join(Sale)
        .join(Product, Product.id == SaleItem.product_id)
        .where(
            Sale.status == SaleStatus.CONFIRMED.value,
            Sale.created_at >= cutoff_start,
            Sale.created_at <= cutoff_end
        )
        .group_by(SaleItem.product_id, Product.name)
        .order_by(desc("total_sold"))
        .limit(limit)
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    return [
        {"product_id": row.product_id, "name": row.name, "total_sold": row.total_sold, "revenue": row.revenue}
        for row in rows
    ]
