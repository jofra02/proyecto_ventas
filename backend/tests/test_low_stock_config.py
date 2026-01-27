import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.database import get_db
import uuid

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_create_product_with_min_stock(async_client):
    uid = str(uuid.uuid4())[:8]
    payload = {
        "name": f"Config Product {uid}",
        "sku": f"CFG-{uid}",
        "price": 100.0,
        "min_stock_level": 20.0  # Custom level
    }
    
    # Create
    response = await async_client.post("/api/v1/products/", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert data["name"] == payload["name"]
        # In the response model, we might not have exposed min_stock_level explicitly in ProductRead
        # The schema ProductRead inherits from ProductCreate, so it SHOULD be there if pydantic works standardly.
        assert "min_stock_level" in data
        assert data["min_stock_level"] == 20.0
    else:
        # Fallback if creation fails (e.g. auth required in test env and not mocked)
        # But our previous tests showed endpoints open or we need to handle auth.
        # Let's assume open or we need to check response.
        print(f"Failed to create: {response.text}")
        assert response.status_code == 200
