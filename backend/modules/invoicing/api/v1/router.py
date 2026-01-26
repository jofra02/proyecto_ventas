from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database import get_db
from modules.invoicing.domain.models import Document, DocumentStatus
from modules.sales.domain.models import Sale
from modules.inventory.application.service import StockService
from pydantic import BaseModel

router = APIRouter(prefix="/documents", tags=["Invoicing"])

class IssueDocumentRequest(BaseModel):
    sale_id: int

@router.post("/issue")
async def issue_document(data: IssueDocumentRequest, db: AsyncSession = Depends(get_db)):
    sale = await db.get(Sale, data.sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Create Document
    # Calculate total from sale items (simplified)
    # In a real app, we might recalculate or use stored total
    total = sum(item.qty * item.price for item in sale.items)
    
    doc = Document(
        sale_id=sale.id,
        status=DocumentStatus.ISSUED.value,
        total=total
    )
    db.add(doc)
    await db.flush()

    # Commit Stock using Inventory Service
    stock_service = StockService(db)
    for item in sale.items:
        await stock_service.commit_stock(
            product_id=item.product_id,
            warehouse_id=sale.warehouse_id,
            qty=item.qty,
            reference_id=f"DOC-{doc.id}"
        )
    
    # Update Accounts Receivable if customer exists
    if sale.customer_id:
        from modules.accounts_receivable.application.service import AccountService
        account_service = AccountService(db)
        await account_service.posting_invoice(
            customer_id=sale.customer_id,
            amount=total,
            document_id=doc.id
        )

    await db.commit()
    return {"status": DocumentStatus.ISSUED.value, "document_id": doc.id, "total": total}

@router.get("/")
async def list_documents(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    stmt = select(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{document_id}")
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    # In a real app, this would return PDF data or full details
    # For now, we return the document meta + linked sale items for rendering
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Fetch sale to get items (quick workaround, ideally Document has its own snapshot)
    sale = await db.get(Sale, doc.sale_id)
    return {
        "document": doc,
        "items": sale.items if sale else [],
        "customer_id": sale.customer_id if sale else None
    }
