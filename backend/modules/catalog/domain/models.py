from sqlalchemy import Column, Integer, String, Boolean, Float, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from core.database import Base

# Association Table for Many-to-Many
product_supplier_association = Table(
    "product_supplier_association",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id"), primary_key=True),
    Column("supplier_id", Integer, ForeignKey("suppliers.id"), primary_key=True),
)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, default=0.0)
    
    # Costing
    cost_price = Column(Float, default=0.0)
    # Note: Other costs (Freight, Taxes) are now in 'product_cost_components' table
    
    # Inventory flags
    track_expiry = Column(Boolean, default=False)
    is_batch_tracked = Column(Boolean, default=False)
    min_stock_level = Column(Float, default=10.0) # Default low stock threshold
    unit_of_measure = Column(String, default="unit") # e.g. unit, kg, g, l, m
    product_type = Column(String, default="unitary") # unitary, fractional, pack
    measurement_value = Column(Float, nullable=True) # e.g. 500, 1.5
    measurement_unit = Column(String, nullable=True) # e.g. g, L, ml
    
    # Many-to-Many Relationship
    suppliers = relationship("Supplier", secondary=product_supplier_association, backref="products", lazy="selectin")

    barcodes = relationship("ProductBarcode", back_populates="product", lazy="selectin")
    cost_components = relationship("ProductCostComponent", back_populates="product", lazy="selectin", primaryjoin="Product.id == foreign(ProductCostComponent.product_id)")

class ProductBarcode(Base):
    __tablename__ = "product_barcodes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    barcode = Column(String, unique=True, index=True, nullable=False)
    
    product = relationship("Product", back_populates="barcodes")
