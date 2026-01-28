from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import enum

class StockMovementType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    ADJUST = "ADJUST"
    RESERVE = "RESERVE"
    RELEASE = "RELEASE"
    COMMIT = "COMMIT"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    is_default = Column(Boolean, default=False)

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    sku = Column(String, index=True, nullable=False) # Denormalized for easier lookup
    manufacture_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)

class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True) # Optional if not batch tracked
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True) # Source of stock (for IN movements)
    
    qty = Column(Float, nullable=False)
    type = Column(String, nullable=False) # Store Enum as string for simplicity with SQLite/Postgres compat
    reference_id = Column(String, nullable=True) # e.g., Sales Order ID, PO ID
    
    created_at = Column(DateTime, default=datetime.utcnow)
