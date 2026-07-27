from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, quotes, my_quotes, my_templates, my_company, payments

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
api_router.include_router(my_quotes.router, prefix="/my/quotes", tags=["my-quotes"])
api_router.include_router(my_templates.router, prefix="/my/templates", tags=["my-templates"])
api_router.include_router(my_company.router, prefix="/my/company-info", tags=["my-company"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])