from fastapi import APIRouter, HTTPException
from ...domain.schemas import PrintJobRequest, PrintJobResponse
from ...application.service import ReceiptService
import base64

router = APIRouter(prefix="/printing", tags=["Printing"])

@router.post("/generate-raw", response_model=PrintJobResponse)
async def generate_raw_print_job(request: PrintJobRequest):
    """
    Generates RAW ESC/POS bytes for a given receipt and printer configuration.
    Returns the bytes encoded in Base64.
    """
    try:
        # Generate bytes using the service
        raw_bytes = ReceiptService.generate_receipt_bytes(request.receipt, request.config)
        
        # Encode to Base64 for transport
        b64_str = base64.b64encode(raw_bytes).decode('utf-8')
        
        return PrintJobResponse(raw_bytes_base64=b64_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
