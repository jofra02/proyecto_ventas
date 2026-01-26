from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import enum

class SaleStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default=SaleStatus.DRAFT.value)
    warehouse_id = Column(Integer, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True) # Link to Customer
    
    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("SaleItem", back_populates="sale", lazy="joined")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty = Column(Float, nullable=False)
    price = Column(Float, default=0.0)

    sale = relationship("Sale", back_populates="items")
