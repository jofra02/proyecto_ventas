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
async def test_low_stock_with_null_min_level(async_client, db_session):
    # 1. Direct DB Insert with NULL min_stock_level (simulating old data)
    uid = str(uuid.uuid4())[:8]
    product = Product(
        name=f"Old Data Product {uid}",
        sku=f"OLD-{uid}",
        price=10.0,
        min_stock_level=None # Explicitly None
    )
    db_session.add(product)
    await db_session.commit()
    
    # 2. Call Alert Endpoint
    response = await async_client.get("/api/v1/inventory/alerts/low-stock")
    assert response.status_code == 200
    data = response.json()
    
    # 3. Verify Product is in list
    found = any(p["product_id"] == product.id for p in data)
    assert found, "Product with NULL min_stock_level should be in alerts (treated as 10.0)"
    
    # 4. Verify min_level in response is 10.0
    item = next(p for p in data if p["product_id"] == product.id)
    assert item["min_level"] == 10.0
