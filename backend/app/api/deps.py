from __future__ import annotations

import time
from typing import TYPE_CHECKING, Annotated, AsyncGenerator
from functools import lru_cache

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
from sqlalchemy import select

from app.core.config import settings
from app.core.security import decode_token
from app.db.session import async_session_maker
from app.models.user import User

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession
    from fastapi import Depends
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security: "HTTPBearer" = HTTPBearer()

# In-memory rate limiting storage (use Redis in production)
_rate_limit_store: dict[str, list[float]] = {}


async def get_current_user(
    credentials: Annotated["HTTPAuthorizationCredentials", "Depends(security)"],
    db: Annotated["AsyncSession", "Depends(get_db)"],
) -> User:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
    except (JWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
        )
    return user


def get_rate_limit(max_requests: int, window_seconds: int = 60):
    """Create a rate limit dependency."""
    async def rate_limit_check(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = f"{client_ip}:{path}"
        now = time.time()

        if key not in _rate_limit_store:
            _rate_limit_store[key] = []

        # Clean old entries
        _rate_limit_store[key] = [t for t in _rate_limit_store[key] if now - t < window_seconds]

        if len(_rate_limit_store[key]) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={"error": {"code": "RATE_LIMITED", "message": "요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요."}},
            )

        _rate_limit_store[key].append(now)

    from fastapi import Depends
    return Depends(rate_limit_check)


# Specific rate limiters for different endpoints
rate_limit_preview = get_rate_limit(30, 60)      # 30 req/min for preview
rate_limit_create = get_rate_limit(10, 60)       # 10 req/min for create
rate_limit_view = get_rate_limit(60, 60)         # 60 req/min for view
rate_limit_pdf = get_rate_limit(20, 60)          # 20 req/min for PDF
rate_limit_auth = get_rate_limit(5, 60)          # 5 req/min for auth endpoints


# Re-export get_db from db.session
async def get_db() -> AsyncGenerator["AsyncSession", None]:
    """Dependency for getting DB session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()