from core.database import get_db
from modules.catalog.domain.models import Product
from sqlalchemy import select
import asyncio

async def check_data():
    async for db in get_db():
        result = await db.execute(select(Product))
        products = result.scalars().all()
        print(f"Found {len(products)} products")
        for p in products:
            print(f"Product: {p.name} (ID: {p.id}) | Stock Min: {p.min_stock_level} (Type: {type(p.min_stock_level)})")

if __name__ == "__main__":
    asyncio.run(check_data())
