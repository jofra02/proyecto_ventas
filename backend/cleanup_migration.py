from sqlalchemy import create_engine, text
from core.database import settings

# Helper to clean up failed migration state
def cleanup():
    # Use sync engine for simple script
    url = settings.DATABASE_URL.replace("sqlite+aiosqlite", "sqlite")
    engine = create_engine(url)
    with engine.connect() as conn:
        print("Dropping product_supplier_association table...")
        try:
            conn.execute(text("DROP TABLE product_supplier_association"))
            print("Table dropped.")
        except Exception as e:
            print(f"Error dropping table (might not exist): {e}")
        
if __name__ == "__main__":
    cleanup()
