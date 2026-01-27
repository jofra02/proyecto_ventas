from fastapi import FastAPI
from dataclasses import dataclass
from typing import List, Callable, Optional

@dataclass
class Module:
    name: str
    display_name: Optional[str] = None # User-facing name
    router: Optional[object] = None # FastAPI APIRouter
    models: List[object] = None
    

    def __post_init__(self):
        if self.models is None:
            self.models = []
        if self.display_name is None:
            self.display_name = self.name.title()

class ModuleRegistry:
    def __init__(self):
        self.modules: List[Module] = []

    def register_module(self, module: Module):
        self.modules.append(module)
        print(f"Module registered: {module.name}")

    def include_routers(self, app: FastAPI, prefix: str = ""):
        for module in self.modules:
            if module.router:
                app.include_router(module.router, prefix=prefix)

registry = ModuleRegistry()

# Note: Other routers like iam_router, catalog_router, etc., are assumed to be imported elsewhere
# or will be defined in the context where this function is called.
# In a real app we'd import them at top level. For this edit I'm assuming context availability or adding imports.
from modules.iam.api.v1.router import router as iam_router
from modules.catalog.api.v1.router import router as catalog_router
from modules.inventory.api.v1.router import router as inventory_router
from modules.sales.api.v1.router import router as sales_router
from modules.payments.api.v1.router import router as payments_router
from modules.accounts_receivable.api.v1.router import router as ar_router
from modules.invoicing.api.v1.router import router as invoicing_router
from modules.customers.api.v1.router import router as customer_router

def register_modules(app: FastAPI):
    # Core
    app.include_router(iam_router, prefix="/api/v1")
    
    # Modules
    app.include_router(catalog_router, prefix="/api/v1")
    app.include_router(inventory_router, prefix="/api/v1")
    app.include_router(sales_router, prefix="/api/v1")
    app.include_router(payments_router, prefix="/api/v1")
    app.include_router(ar_router, prefix="/api/v1")
    app.include_router(invoicing_router, prefix="/api/v1")
    app.include_router(customer_router, prefix="/api/v1")
