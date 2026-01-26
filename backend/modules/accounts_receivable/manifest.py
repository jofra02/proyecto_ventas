from app.module_registry import Module
from .domain import models

# No router exposed for AR in this stage (internal service only)
module = Module(
    name="accounts_receivable",
    models=[models.CustomerLedger]
)
