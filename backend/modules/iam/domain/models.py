from sqlalchemy import Column, Integer, String, DateTime
from core.database import Base
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SUPERVISOR = "SUPERVISOR"
    EMPLOYEE = "EMPLOYEE"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default=UserRole.EMPLOYEE.value) 
    custom_permissions = Column(String, default="") # Comma-separated list of extra permissions
    
    created_at = Column(DateTime, default=datetime.utcnow)
