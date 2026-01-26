from sqlalchemy.ext.asyncio import AsyncSession
from modules.inventory.domain.models import StockMovement, StockMovementType, Batch
from sqlalchemy import select, func
from fastapi import HTTPException

class StockService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def reserve_stock(self, product_id: int, warehouse_id: int, qty: float, reference_id: str):
        """
        Creates a RESERVE movement.
        TODO: Implement FEFO/FIFO logic to select specific batches. 
        For now, we just create a generic reservation (negative qty in logic usually, but here we track type).
        """
        # Simple check for total stock availability (optional but good)
        # For MVP, we allow reservation even if negative (backorder) or assume check is done elsewhere.
        
        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse_id,
            qty=qty, # Positive value for reservation amount? Or negative? 
                     # Usually Reserve is a claim. Let's keep it positive and interpret 'RESERVE' as a claim.
            type=StockMovementType.RESERVE.value,
            reference_id=str(reference_id)
        )
        self.db.add(movement)
        await self.db.flush()
        return movement

    async def commit_stock(self, product_id: int, warehouse_id: int, qty: float, reference_id: str):
        """
        Creates a COMMMIT movement (Real OUT).
        Used when an invoice is issued.
        """
        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse_id,
            qty=qty,
            type=StockMovementType.COMMIT.value,
            reference_id=str(reference_id)
        )
        self.db.add(movement)
        await self.db.flush()
        return movement
