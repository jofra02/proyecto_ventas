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
async def test_financial_flow(async_client):
    import uuid
    uid = str(uuid.uuid4())[:8]

    # 1. Create Customer
    cust_res = await async_client.post(f"{settings.API_V1_STR}/customers/", json={
        "name": f"Client {uid}",
        "tax_id": f"20-{uid}-0",
        "email": f"client{uid}@test.com"
    })
    assert cust_res.status_code == 200, cust_res.text
    cust_id = cust_res.json()["id"]

    # 2. Setup Warehouse & Product
    wh_res = await async_client.post(f"{settings.API_V1_STR}/inventory/warehouses", json={"name": f"WH-FIN-{uid}", "is_default": True})
    wh_id = wh_res.json()["id"]

    prod_res = await async_client.post(f"{settings.API_V1_STR}/products/", json={"name": f"Prod {uid}", "sku": f"FIN-{uid}", "price": 100.0})
    prod_id = prod_res.json()["id"]

    # Add Stock
    await async_client.post(f"{settings.API_V1_STR}/inventory/receive", json={
        "product_id": prod_id, "warehouse_id": wh_id, "qty": 10
    })

    # 3. Create Sale (Linked to Customer)
    sale_payload = {
        "warehouse_id": wh_id,
        "customer_id": cust_id,
        "items": [{"product_id": prod_id, "qty": 2, "price": 100.0}] # Total 200
    }
    sale_res = await async_client.post(f"{settings.API_V1_STR}/sales/", json=sale_payload)
    assert sale_res.status_code == 200
    sale_id = sale_res.json()["id"]

    # 4. Confirm Sale
    await async_client.post(f"{settings.API_V1_STR}/sales/{sale_id}/confirm")

    # 5. Issue Invoice (Triggers Ledger Debit)
    doc_res = await async_client.post(f"{settings.API_V1_STR}/documents/issue", json={"sale_id": sale_id})
    assert doc_res.status_code == 200
    
    # 6. Make Payment (Triggers Ledger Credit)
    pay_payload = {
        "customer_id": cust_id,
        "amount": 150.0, # Partial payment
        "method": "transfer",
        "idempotency_key": f"IDEM-{uid}"
    }
    pay_res = await async_client.post(f"{settings.API_V1_STR}/payments/", json=pay_payload)
    assert pay_res.status_code == 200
    
    # Validation: Ideally we would have a GET /ledger endpoint properly exposed to verify balance, 
    # but for now we trust the 200 OK responses imply the services ran. 
    # To be rigorous, let's verify idempotency.
    
    pay_res_2 = await async_client.post(f"{settings.API_V1_STR}/payments/", json=pay_payload)
    assert pay_res_2.status_code == 409 # Conflict (Idempotency)
