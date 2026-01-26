from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from modules.sales.domain.models import Sale, SaleItem, SaleStatus
from modules.admin.application.service import SettingsService

class SalesAnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings_service = SettingsService(db)

    async def get_sales_trend(self, start_date: datetime = None, end_date: datetime = None):
        """
        Calculates revenue over a time range.
        If dates not provided, defaults to last 7 days.
        Determine resolution (hour vs day) based on range size.
        """
        # Fetch Timezone Offset
        # Stored as string "-3" or "+1"
        offset_str = await self.settings_service.get_setting("timezone_offset", "0")
        try:
            offset_hours = int(offset_str)
        except:
            offset_hours = 0
            
        time_modifier = f"{offset_hours:+} hours" # e.g., "-3 hours"

        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=7)
            
        # Determine grouping interval
        duration = end_date - start_date
        
        # If range < 2 days, group by HOUR (or even minute if needed, but hour is safer for now)
        is_hourly = duration.total_seconds() < 48 * 3600
        
        # 1. Generate full list of expected points
        points = []
        current = start_date
        
        # NOTE: If we shift DB times by offset, we should also shift our "expected points" logic?
        # Actually, "start_date" and "end_date" passed in are usually derived from "now" (UTC/Server).
        # But if the user selects "Today" in Frontend (Local Time), they convert it to UTC.
        # So "start_date" is correct UTC.
        # BUT... the bucketing needs to be in LOCAL time to match the user's perception of "Days".
        # Example: User in Japan (UTC+9) asks for "Trend".
        # Sales at 23:00 UTC (08:00 JP next day) should be in the NEXT bucket if displaying JP time.
        
        # So yes, we apply the shift to the DB column BEFORE truncating.
        
        # We also need to shift our Python "current" iterator to match the target timezone logic?
        # Simpler: Generate points in UTC, but label them in Local? 
        # No, Recharts just plots what we give.
        # Best approach: Shift the generated points logic is tricky without full tz support.
        # Let's trust the database grouping first.
        
        if is_hourly:
            # Floor to nearest hour
            current = current.replace(minute=0, second=0, microsecond=0)
            while current <= end_date:
                points.append(current)
                current += timedelta(hours=1)
        else:
            # Floor to date
            current = current.replace(hour=0, minute=0, second=0, microsecond=0)
            while current <= end_date:
                points.append(current)
                current += timedelta(days=1)

        # 2. Query DB
        # Apply Timezone Shift to created_at BEFORE formatting
        # SQLite: datetime(created_at, modifier)
        
        shifted_time = func.datetime(Sale.created_at, time_modifier)

        if is_hourly:
            # SQLite specific for 'YYYY-MM-DD HH:00:00'
            time_col = func.strftime('%Y-%m-%d %H:00:00', shifted_time).label("time_bucket")
        else:
            time_col = func.date(shifted_time).label("time_bucket")

        stmt = (
            select(
                time_col,
                func.sum(SaleItem.qty * SaleItem.price).label("revenue")
            )
            .join(SaleItem, Sale.id == SaleItem.sale_id)
            .where(
                Sale.status == SaleStatus.CONFIRMED.value,
                Sale.created_at >= start_date,
                Sale.created_at <= end_date
            )
            .group_by("time_bucket")
            .order_by("time_bucket")
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        # 3. Transform to Dict
        sales_map = {row.time_bucket: row.revenue for row in rows}
        
        # 4. Merge
        trend_data = []
        for p in points:
            # Key generation must match SQL output format
            if is_hourly:
                key = p.strftime('%Y-%m-%d %H:00:00')
                label = p.strftime("%H:%M") # Hour:Minute
            else:
                key = p.strftime('%Y-%m-%d')
                label = p.strftime("%d/%m") # Day/Month
                
            revenue = sales_map.get(key, 0.0)
            trend_data.append({
                "date": label,
                "full_date": key,
                "revenue": revenue
            })
            
        return trend_data
