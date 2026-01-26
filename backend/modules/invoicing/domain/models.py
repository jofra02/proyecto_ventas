from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum
from core.database import Base
from datetime import datetime
import enum

class DocumentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    VOID = "VOID"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True) # Optional link to sale
    status = Column(String, default=DocumentStatus.DRAFT.value)
    total = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
