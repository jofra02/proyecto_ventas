import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.config import get_settings

settings = get_settings()

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_picking_flow(async_client):
    import uuid
    uid = str(uuid.uuid4())[:8]

    # 1. Setup Product + Barcode
    prod_res = await async_client.post(f"{settings.API_V1_STR}/products/", json={
        "name": f"Scan Prod {uid}", 
        "sku": f"SCAN-{uid}", 
        "price": 50.0
    })
    prod_id = prod_res.json()["id"]
    barcode = f"12345{uid}"
    await async_client.post(f"{settings.API_V1_STR}/products/{prod_id}/barcodes", json={"barcode": barcode})

    # 2. Setup Warehouse & Stock
    wh_res = await async_client.post(f"{settings.API_V1_STR}/inventory/warehouses", json={"name": f"WH-PICK-{uid}"})
    wh_id = wh_res.json()["id"]
    await async_client.post(f"{settings.API_V1_STR}/inventory/receive", json={
        "product_id": prod_id, "warehouse_id": wh_id, "qty": 10
    })

    # 3. Create & Confirm Sale
    sale_res = await async_client.post(f"{settings.API_V1_STR}/sales/", json={
        "warehouse_id": wh_id,
        "items": [{"product_id": prod_id, "qty": 1, "price": 50.0}]
    })
    sale_id = sale_res.json()["id"]
    await async_client.post(f"{settings.API_V1_STR}/sales/{sale_id}/confirm")

    # 4. Create Pick Task
    task_res = await async_client.post(f"{settings.API_V1_STR}/picking/tasks?sale_id={sale_id}")
    assert task_res.status_code == 200
    task_id = task_res.json()["id"]

    # 5. Scan Barcode (Success)
    scan_res = await async_client.post(f"{settings.API_V1_STR}/picking/scan", json={
        "task_id": task_id,
        "barcode": barcode
    })
    assert scan_res.status_code == 200
    assert scan_res.json()["status"] == "MATCH"
    assert scan_res.json()["scanned_qty"] == 1

    # 6. Scan Wrong Barcode
    scan_res_bad = await async_client.post(f"{settings.API_V1_STR}/picking/scan", json={
        "task_id": task_id,
        "barcode": "WRONG-BARCODE"
    })
    assert scan_res_bad.json()["status"] == "NOT_FOUND"
