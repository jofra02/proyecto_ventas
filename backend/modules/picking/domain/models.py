from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime
import enum

class PickTaskStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

class PickTask(Base):
    __tablename__ = "pick_tasks"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, unique=True)
    status = Column(String, default=PickTaskStatus.PENDING.value)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    scan_events = relationship("PickScanEvent", back_populates="task", lazy="selectin")

class PickScanEvent(Base):
    __tablename__ = "pick_scan_events"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("pick_tasks.id"), nullable=False, index=True)
    barcode_scanned = Column(String, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False) # Resolved product
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    task = relationship("PickTask", back_populates="scan_events")
