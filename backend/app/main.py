from fastapi import FastAPI
from core.config import get_settings
from app.module_registry import registry

settings = get_settings()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )
    
    from fastapi.middleware.cors import CORSMiddleware
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 1. Register Modules
    from modules.iam.api.v1 import router as iam_router
    from modules.catalog.api.v1 import router as catalog_router
    from modules.inventory.api.v1 import router as inventory_router
    from modules.sales.api.v1 import router as sales_router
    from modules.customers.api.v1 import router as customers_router
    from modules.admin.api.v1 import router as admin_router
    from modules.suppliers.api.v1 import router as suppliers_router

    app.include_router(iam_router.router, prefix=settings.API_V1_STR)
    app.include_router(catalog_router.router, prefix=settings.API_V1_STR)
    app.include_router(inventory_router.router, prefix=settings.API_V1_STR)
    app.include_router(sales_router.router, prefix=settings.API_V1_STR)
    app.include_router(customers_router.router, prefix=settings.API_V1_STR)
    app.include_router(customers_router.router, prefix=settings.API_V1_STR)
    app.include_router(admin_router.router, prefix=settings.API_V1_STR)
    app.include_router(suppliers_router.router, prefix=settings.API_V1_STR)
    
    from modules.catalog import manifest as catalog_manifest
    from modules.inventory import manifest as inventory_manifest
    from modules.sales import manifest as sales_manifest
    from modules.invoicing import manifest as invoicing_manifest
    from modules.customers import manifest as customers_manifest
    from modules.accounts_receivable import manifest as ar_manifest
    from modules.picking import manifest as picking_manifest
    from modules.iam import manifest as iam_manifest
    from modules.suppliers import manifest as suppliers_manifest
    from modules.finance import manifest as finance_manifest
    
    registry.register_module(catalog_manifest.module)
    registry.register_module(inventory_manifest.module)
    registry.register_module(sales_manifest.module)
    registry.register_module(invoicing_manifest.module)
    registry.register_module(customers_manifest.module)
    registry.register_module(customers_manifest.module)
    registry.register_module(ar_manifest.module)
    registry.register_module(picking_manifest.module)
    registry.register_module(iam_manifest.module)
    registry.register_module(suppliers_manifest.module)
    registry.register_module(finance_manifest.module)
    
    # 2. Include Routers
    registry.include_routers(app, prefix=settings.API_V1_STR)

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "app": settings.PROJECT_NAME}

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
