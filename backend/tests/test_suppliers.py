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
async def test_supplier_flow(async_client):
    uid = str(uuid.uuid4())[:8]
    
    # 1. Create Supplier with TRANSFER details
    payment_details = {
        "bank": "Test Bank",
        "cbu": "1234567890123456789012",
        "alias": "TEST.ALIAS"
    }
    
    res = await async_client.post("/api/v1/suppliers/", json={
        "name": f"Supplier {uid}",
        "payment_method": "TRANSFER",
        "payment_details": payment_details
    })
    
    assert res.status_code == 200
    data = res.json()
    supplier_id = data["id"]
    assert data["payment_details"]["alias"] == "TEST.ALIAS"

    # 2. Update Supplier
    res = await async_client.put(f"/api/v1/suppliers/{supplier_id}", json={
        "payment_method": "CHECK",
        "payment_details": {"beneficiary": "John Doe"}
    })
    assert res.status_code == 200
    assert res.json()["payment_method"] == "CHECK"
    assert res.json()["payment_details"]["beneficiary"] == "John Doe"

    # 3. Create Product linked to Supplier
    res = await async_client.post("/api/v1/products/", json={
        "name": f"Prod {uid}",
        "sku": f"SUP-{uid}",
        "price": 100,
        "supplier_id": supplier_id
    })
    assert res.status_code == 200
    prod_data = res.json()
    assert prod_data["supplier_id"] == supplier_id
