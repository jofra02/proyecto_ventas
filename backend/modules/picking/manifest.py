from app.module_registry import Module
from .api.v1.router import router
from .domain import models

module = Module(
    name="picking",
    router=router,
    models=[models.PickTask, models.PickScanEvent]
)
