from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from core.database import Base
from datetime import datetime
import enum

class LedgerEntryType(str, enum.Enum):
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"
    ADJUSTMENT = "ADJUSTMENT"

class CustomerLedger(Base):
    __tablename__ = "customer_ledger"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    
    amount = Column(Float, nullable=False) # Positive = Debit (receivable increases), Negative = Credit (receivable decreases)
    type = Column(String, nullable=False) # LedgerEntryType
    reference_id = Column(String, nullable=True) # e.g., "DOC-123", "PAY-456"

    created_at = Column(DateTime, default=datetime.utcnow)
