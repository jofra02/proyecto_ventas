from sqlalchemy import Column, Integer, String, DateTime
from core.database import Base
from datetime import datetime

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    tax_id = Column(String, unique=True, index=True, nullable=True) # CUIT/DNI
    email = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
