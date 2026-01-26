from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    
    # Inventory flags
    track_expiry = Column(Boolean, default=False)
    is_batch_tracked = Column(Boolean, default=False)
    min_stock_level = Column(Float, default=10.0) # Default low stock threshold

    barcodes = relationship("ProductBarcode", back_populates="product", lazy="selectin")

class ProductBarcode(Base):
    __tablename__ = "product_barcodes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    
    product = relationship("Product", back_populates="barcodes")
