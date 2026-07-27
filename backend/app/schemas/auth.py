from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    company_name: str = Field(min_length=1, max_length=100)
    ceo_name: str = Field(min_length=1, max_length=50)
    biz_reg_no: str = Field(pattern=r"^\d{10}$")
    company_address: Optional[dict] = None
    phone: str = Field(pattern=r"^01[0-9]-?\d{4}-?\d{4}$|^02-?\d{3,4}-?\d{4}$|^0[3-9]{1,2}-?\d{3,4}-?\d{4}$")


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    company_name: Optional[str] = None
    plan: str
    created_at: datetime


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    company_name: Optional[str] = None
    ceo_name: Optional[str] = None
    biz_reg_no: Optional[str] = None
    company_address: Optional[dict] = None
    phone: Optional[str] = None
    plan: str
    quote_seq: int
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime


class RefreshTokenRequest(BaseModel):
    refresh_token: str