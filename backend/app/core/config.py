from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(v: str | List[str]) -> List[str]:
    """Parse CORS origins from JSON string or comma-separated string."""
    if isinstance(v, list):
        return v
    if isinstance(v, str):
        v = v.strip()
        if v.startswith('['):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                pass
        return [origin.strip() for origin in v.split(',') if origin.strip()]
    return []


def convert_to_async_url(url: str) -> str:
    """Convert sync PostgreSQL URL to async (asyncpg) URL."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql+psycopg2://"):
        return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/quote_nemo",
        alias="DATABASE_URL",
    )
    database_url_sync: str = Field(
        default="postgresql://postgres:***@localhost:5432/quote_nemo",
        alias="DATABASE_URL_SYNC",
    )

    # Async database URL (computed property)
    @property
    def async_database_url(self) -> str:
        """Get async database URL, converting from sync if needed."""
        # Use the raw database_url env var, ensuring it's async
        return convert_to_async_url(self.database_url)

    # App
    app_name: str = Field(default="율소프트 견적서", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    debug: bool = Field(default=True, alias="DEBUG")
    secret_key: str = Field(
        default="your-secret-key-change-in-production-min-32-chars",
        alias="SECRET_KEY",
    )
    algorithm: str = Field(default="HS256", alias="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # CORS - store as string, parse via property
    cors_origins_raw: str = Field(
        default='["http://localhost:3000", "http://localhost:3001", "https://yulsoft.kr"]',
        alias="CORS_ORIGINS",
    )

    @property
    def cors_origins(self) -> List[str]:
        return parse_cors_origins(self.cors_origins_raw)

    # Rate Limiting
    rate_limit_preview: int = Field(default=30, alias="RATE_LIMIT_PREVIEW")
    rate_limit_create: int = Field(default=10, alias="RATE_LIMIT_CREATE")
    rate_limit_view: int = Field(default=60, alias="RATE_LIMIT_VIEW")
    rate_limit_pdf: int = Field(default=20, alias="RATE_LIMIT_PDF")

    # PDF
    watermark_text: str = Field(default="Powered by 율소프트 | www.yulsoft.kr", alias="WATERMARK_TEXT")
    pdf_font_path: str = Field(
        default="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        alias="PDF_FONT_PATH",
    )
    pdf_font_bold_path: str = Field(
        default="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        alias="PDF_FONT_BOLD_PATH",
    )

    # Expiration
    default_expires_days: int = Field(default=30, alias="DEFAULT_EXPIRES_DAYS")
    max_expires_days: int = Field(default=365, alias="MAX_EXPIRES_DAYS")

    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")

    # Frontend URL
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    @property
    def base_dir(self) -> Path:
        return Path(__file__).resolve().parent.parent

    @property
    def templates_dir(self) -> Path:
        return self.base_dir / "app" / "templates"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()