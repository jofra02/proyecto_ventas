from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from core.database import Base
from datetime import datetime

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    method = Column(String, nullable=True) # Cash, Transfer
    
    # Idempotency
    idempotency_key = Column(String, unique=True, index=True, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
