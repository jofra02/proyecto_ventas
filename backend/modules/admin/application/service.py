from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from modules.admin.domain.models import SystemSetting

class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_setting(self, key: str, default: str = None) -> str:
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        result = await self.db.execute(stmt)
        setting = result.scalar_one_or_none()
        if setting:
            return setting.value
        return default

    async def set_setting(self, key: str, value: str, description: str = None):
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        result = await self.db.execute(stmt)
        setting = result.scalar_one_or_none()
        
        if setting:
            setting.value = str(value)
            if description:
                setting.description = description
        else:
            setting = SystemSetting(key=key, value=str(value), description=description)
            self.db.add(setting)
        
        await self.db.commit()
        await self.db.refresh(setting)
        return setting
