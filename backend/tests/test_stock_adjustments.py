import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.database import get_db
from modules.catalog.domain.models import Product
import uuid

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def db_session():
    async for session in get_db():
        yield session

@pytest.mark.asyncio
async def test_stock_adjustment(async_client, db_session):
    # 1. Create Product
    uid = str(uuid.uuid4())[:8]
    product = Product(name=f"Adjust Prod {uid}", sku=f"ADJ-{uid}", price=10.0)
    db_session.add(product)
    await db_session.commit()
    await db_session.refresh(product)
    
    # Check Initial Stock (0)
    res = await async_client.get("/api/v1/inventory/stock")
    initial_stock = next((p["quantity"] for p in res.json() if p["product_id"] == product.id), 0)
    assert initial_stock == 0

    # 2. Add Stock (+10)
    await async_client.post("/api/v1/inventory/adjust", json={
        "product_id": product.id,
        "warehouse_id": 1,
        "qty": 10,
        "reason": "Initial Count"
    })
    
    res = await async_client.get("/api/v1/inventory/stock")
    stock_after_add = next((p["quantity"] for p in res.json() if p["product_id"] == product.id), 0)
    assert stock_after_add == 10

    # 3. Remove Stock (-3)
    await async_client.post("/api/v1/inventory/adjust", json={
        "product_id": product.id,
        "warehouse_id": 1,
        "qty": -3,
        "reason": "Loss"
    })

    res = await async_client.get("/api/v1/inventory/stock")
    final_stock = next((p["quantity"] for p in res.json() if p["product_id"] == product.id), 0)
    assert final_stock == 7
