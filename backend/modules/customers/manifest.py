from app.module_registry import Module
from .api.v1.router import router
from .domain import models

module = Module(
    name="customers",
    router=router,
    models=[models.Customer]
)
