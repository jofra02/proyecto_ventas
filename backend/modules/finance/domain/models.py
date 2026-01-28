from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, Boolean, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from core.database import Base

class CostCalculationType(str, enum.Enum):
    FIXED_AMOUNT = "fixed_amount"  # e.g., $10 flat freight
    PERCENTAGE_OF_BASE = "percentage_of_base"  # e.g., 21% tax on base cost

class CostCategory(Base):
    __tablename__ = "cost_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    description = Column(String, nullable=True)
    default_type = Column(String, default=CostCalculationType.FIXED_AMOUNT) # Hint for UI
    is_active = Column(Boolean, default=True)

class ProductCostComponent(Base):
    __tablename__ = "product_cost_components"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    cost_category_id = Column(Integer, ForeignKey("cost_categories.id"), nullable=False)
    
    value = Column(Float, default=0.0) # The amount ($10) or percentage (0.21)
    
    # Relationships
    product = relationship("modules.catalog.domain.models.Product", back_populates="cost_components")
    category = relationship("CostCategory", lazy="joined")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=True) # Cash, Transfer
    
    # Idempotency
    idempotency_key = Column(String, unique=True, index=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
