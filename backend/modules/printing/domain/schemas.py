from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ReceiptItem(BaseModel):
    name: str = Field(..., max_length=24) # Truncate for thermal printers
    qty: float
    price: float
    total: float
    measurement_unit: Optional[str] = None

class ReceiptPayment(BaseModel):
    method: str
    amount: float

class ReceiptData(BaseModel):
    store_name: str
    store_address: Optional[str] = None
    store_cuit: Optional[str] = None
    store_iva: Optional[str] = None
    sale_id: str
    date: datetime
    customer_name: Optional[str] = None
    customer_tax_id: Optional[str] = None
    items: List[ReceiptItem]
    subtotal: float
    total: float
    payments: List[ReceiptPayment]
    qr_data: Optional[str] = None

class PrinterConfig(BaseModel):
    paper_width: int = 80 # 80 or 58 mm
    encoding: str = "cp850" # default western europe
    cut_mode: str = "partial" # full or partial
    feed_lines: int = 4

class PrintJobRequest(BaseModel):
    receipt: ReceiptData
    config: PrinterConfig

class PrintJobResponse(BaseModel):
    raw_bytes_base64: str
