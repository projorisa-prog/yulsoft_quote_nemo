from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from alembic.config import Config
from alembic import command

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.db.session import create_db_and_tables, engine

logger = get_logger(__name__)


def run_migrations() -> None:
    """Run alembic migrations synchronously."""
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url_sync)
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    setup_logging()
    logger.info("Starting application")
    
    # Create tables
    await create_db_and_tables()
    
    # Run alembic migrations in thread pool to avoid blocking
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_migrations)
        logger.info("Alembic migrations completed")
    except Exception as e:
        logger.warning(f"Migration skipped/failed: {e}")
    
    yield
    
    await engine.dispose()
    logger.info("Shutting down application")


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.error("Database error", error=str(exc), path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "데이터베이스 오류가 발생했습니다.",
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception", error=str(exc), path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "서버 내부 오류가 발생했습니다.",
                }
            },
        )

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": settings.app_version}

    app.include_router(api_router, prefix="/api")

    return app


app = create_app()