from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from modules.admin.application.service import SettingsService
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["Admin"])

class SettingUpdate(BaseModel):
    value: str
    description: str | None = None

@router.get("/settings/{key}")
async def get_setting(key: str, db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    val = await service.get_setting(key)
    return {"key": key, "value": val}

@router.post("/settings/{key}")
async def update_setting(key: str, data: SettingUpdate, db: AsyncSession = Depends(get_db)):
    service = SettingsService(db)
    setting = await service.set_setting(key, data.value, data.description)
    return setting
