from app.module_registry import Module
from .api.v1.router import router
from .domain import models

module = Module(
    name="finance",
    display_name="Finance",
    router=router,
    models=[models.CostCategory, models.ProductCostComponent, models.Payment]
)
