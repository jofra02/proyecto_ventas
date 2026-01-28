from app.module_registry import Module
from .api.v1.router import router
from .domain import models

module = Module(
    name="catalog",
    display_name="Products",
    router=router,
    models=[models.Product]
)
