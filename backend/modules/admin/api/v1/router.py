from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from modules.admin.application.service import SettingsService
from modules.iam.api.v1.router import RoleChecker
from modules.iam.domain.models import UserRole
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class SettingUpdate(BaseModel):
    value: str
    description: str | None = None

class BatchSettingsUpdate(BaseModel):
    settings: dict[str, str]

@router.get("/settings/{key}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    val = await service.get_setting(key)
    return {"key": key, "value": val}

@router.post("/settings/{key}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def update_setting(key: str, data: SettingUpdate, db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    setting = await service.set_setting(key, data.value, data.description)
    return setting

@router.post("/settings/batch/update", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def update_settings_batch(data: BatchSettingsUpdate, db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    results = []
    for key, value in data.settings.items():
        setting = await service.set_setting(key, value)
        results.append(setting)
    return {"status": "success", "updated": len(results)}

from app.module_registry import registry

@router.get("/modules")
def list_modules():
    return [{"name": m.name, "display_name": m.display_name} for m in registry.modules]
