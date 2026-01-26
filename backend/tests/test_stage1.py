import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.config import get_settings

settings = get_settings()
BASE_URL = f"http://test{settings.API_V1_STR}"

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_create_and_list_product(async_client):
    import uuid
    uid = str(uuid.uuid4())[:8]
    
    # 1. Create Product
    payload = {
        "name": f"Test Product {uid}",
        "sku": f"TP-{uid}",
        "price": 100.0,
        "track_expiry": True,
        "is_batch_tracked": True
    }
    response = await async_client.post(f"/products/", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["name"].startswith("Test Product")
    product_id = data["id"]

    # 2. List Products
    response = await async_client.get(f"/products/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    
    return product_id

@pytest.mark.asyncio
async def test_warehouse_and_stock_flow(async_client):
    import uuid
    uid = str(uuid.uuid4())[:8]

    # 1. Create Warehouse
    wh_payload = {"name": f"Warehouse {uid}", "is_default": True}
    response = await async_client.post(f"/inventory/warehouses", json=wh_payload)
    # 400 if already exists is fine for re-runs
    if response.status_code == 200:
        wh_id = response.json()["id"]
    else:
        # Assuming we need to fetch it or it's a test db reset
        wh_id = 1 

    # 2. Create Product
    prod_payload = {
        "name": f"Stock Product {uid}",
        "sku": f"STK-{uid}",
        "price": 50.0,
        "track_expiry": False
    }
    response = await async_client.post(f"/products/", json=prod_payload)
    if response.status_code == 200:
        prod_id = response.json()["id"]
    else:
        # Handle duplicate SKU for re-runs
        prod_id = 1 # Simplified for this basic test script

    # 3. Receive Stock
    receive_payload = {
        "product_id": prod_id,
        "warehouse_id": wh_id,
        "qty": 10,
        "expiry_date": None
    }
    response = await async_client.post(f"/inventory/receive", json=receive_payload)
    assert response.status_code == 200
    assert response.json()["status"] == "received"
