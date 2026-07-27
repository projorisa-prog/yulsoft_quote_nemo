from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import quotes, auth, my_quotes, my_templates, my_company, payments

api_router = APIRouter()

api_router.include_router(quotes.router, prefix="/v1/quotes", tags=["quotes"])
api_router.include_router(auth.router, prefix="/v1/auth", tags=["auth"])
api_router.include_router(my_quotes.router, prefix="/v1/my/quotes", tags=["my-quotes"])
api_router.include_router(my_templates.router, prefix="/v1/my/templates", tags=["my-templates"])
api_router.include_router(my_company.router, prefix="/v1/my/company-info", tags=["my-company"])
api_router.include_router(payments.router, prefix="/v1/payments", tags=["payments"])