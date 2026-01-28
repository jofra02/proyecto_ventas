from sqlalchemy import Column, Integer, String, Text, LargeBinary
from core.database import Base
from sqlalchemy.dialects.sqlite import JSON
import json

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    contact_name = Column(String, nullable=True)
    
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    
    # Payment Info
    payment_method = Column(String, default="CASH") # CASH, TRANSFER, CHECK, OTHER
    
    # Flexible payment details (CBU, Alias, Bank Name, Check instructions, etc.)
    # Using String to store JSON for SQLite compatibility helper (or JSON type if supported)
    # Generic approach: Store as text/string, parse in app or Pydantic
    payment_details = Column(Text, nullable=True, default="{}") 
