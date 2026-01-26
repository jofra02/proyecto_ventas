import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.config import get_settings
from modules.sales.domain.models import SaleStatus
from modules.invoicing.domain.models import DocumentStatus

settings = get_settings()

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_sales_flow(async_client):
    import uuid
    uid = str(uuid.uuid4())[:8]

    # 1. Setup Data (Warehouse + Product)
    wh_res = await async_client.post(f"/inventory/warehouses", json={"name": f"WH-{uid}", "is_default": True})
    wh_id = wh_res.json()["id"]

    prod_res = await async_client.post(f"/products/", json={
        "name": f"Sale Prod {uid}", 
        "sku": f"SALE-{uid}", 
        "price": 20.0,
        "track_expiry": False
    })
    prod_id = prod_res.json()["id"]

    # 2. Receive Stock (so we have something positive, although reservation allows negative for now)
    await async_client.post(f"/inventory/receive", json={
        "product_id": prod_id,
        "warehouse_id": wh_id,
        "qty": 100,
        "expiry_date": None
    })

    # 3. Create Draft Sale
    sale_payload = {
        "warehouse_id": wh_id,
        "items": [
            {"product_id": prod_id, "qty": 10, "price": 20.0}
        ]
    }
    sale_res = await async_client.post(f"/sales/", json=sale_payload)
    assert sale_res.status_code == 200, sale_res.text
    sale_data = sale_res.json()
    assert sale_data["status"] == SaleStatus.DRAFT.value
    sale_id = sale_data["id"]

    # 4. Confirm Sale (Should Trigger Reserve)
    confirm_res = await async_client.post(f"/sales/{sale_id}/confirm")
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == SaleStatus.CONFIRMED.value

    # 5. Issue Document (Should Trigger Commit)
    doc_res = await async_client.post(f"/documents/issue", json={"sale_id": sale_id})
    assert doc_res.status_code == 200, doc_res.text
    doc_data = doc_res.json()
    assert doc_data["status"] == DocumentStatus.ISSUED.value
    assert doc_data["total"] == 200.0
