import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from modules.customers.domain.models import Customer
from datetime import datetime, timedelta
import random

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def db_session():
    async for session in get_db():
        yield session

@pytest.mark.asyncio
async def test_get_customer_analytics(async_client, db_session):
    # Create unique email to avoid conflicts
    suffix = random.randint(1000, 9999)
    
    # 1. Direct DB Insert to bypass API and set custom created_at
    # Old customer
    old = Customer(
        name=f"Old {suffix}", 
        tax_id=f"111{suffix}", 
        email=f"old{suffix}@test.com",
        created_at=datetime.utcnow() - timedelta(days=30)
    )
    db_session.add(old)
    
    # New customer
    new_c = Customer(
        name=f"New {suffix}", 
        tax_id=f"222{suffix}", 
        email=f"new{suffix}@test.com",
        created_at=datetime.utcnow() - timedelta(days=1)
    )
    db_session.add(new_c)
    
    await db_session.commit()
    
    # Call Endpoint
    response = await async_client.get("/api/v1/customers/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    
    # We can't assert exact numbers because DB is persistent/shared, 
    # but we can check if it returns valid structure and numbers >= what we added.
    assert data["total_customers"] >= 2
    assert data["new_customers"] >= 1
