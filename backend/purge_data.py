import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from core.config import get_settings

async def purge_data():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    
    tables_to_purge = [
        "sale_items",
        "sales",
        "documents",
        "customer_ledger",
        "payments",
        "customers",
        "stock_movements",
        "batches",
        "warehouses",
        "product_barcodes",
        "products",
        "pick_scan_events",
        "pick_tasks",
        "suppliers"
    ]
    
    async with engine.begin() as conn:
        print("Starting data purge...")
        
        # Disable foreign key checks for the duration of the purge (SQLite specific)
        await conn.execute(text("PRAGMA foreign_keys = OFF;"))
        
        for table in tables_to_purge:
            print(f" - Purging table: {table}")
            await conn.execute(text(f"DELETE FROM {table}"))
            
            # Reset auto-increment counters in SQLite if the sequence table exists
            try:
                await conn.execute(text(f"DELETE FROM sqlite_sequence WHERE name='{table}'"))
            except Exception:
                # sqlite_sequence might not exist if no AUTOINCREMENT has been used yet
                pass
            
        await conn.execute(text("PRAGMA foreign_keys = ON;"))
        print("\nPurge completed successfully.")
        
        # Verification counts
        print("\nVerifying remaining data counts:")
        for table in ["system_settings", "users", "alembic_version"]:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f" - {table}: {count} rows (PRESERVED)")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(purge_data())
