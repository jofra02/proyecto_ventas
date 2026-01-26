from sqlalchemy.ext.asyncio import AsyncSession
from modules.accounts_receivable.domain.models import CustomerLedger, LedgerEntryType

class AccountService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def posting_invoice(self, customer_id: int, amount: float, document_id: int):
        """
        Record a DEBIT (Customer owes money).
        """
        entry = CustomerLedger(
            customer_id=customer_id,
            amount=abs(amount), # Debit is positive
            type=LedgerEntryType.INVOICE.value,
            reference_id=f"DOC-{document_id}"
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def posting_payment(self, customer_id: int, amount: float, payment_id: int):
        """
        Record a CREDIT (Customer pays money).
        """
        entry = CustomerLedger(
            customer_id=customer_id,
            amount=-abs(amount), # Credit is negative
            type=LedgerEntryType.PAYMENT.value,
            reference_id=f"PAY-{payment_id}"
        )
        self.db.add(entry)
        await self.db.flush()
        return entry
