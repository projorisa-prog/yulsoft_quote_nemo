from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Annotated, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.types import StringConstraints


class BuildingType(str, Enum):
    APT = "APT"
    OFFICETEL = "OFFICETEL"
    OFFICE = "OFFICE"
    STORE = "STORE"
    FACTORY = "FACTORY"
    ETC = "ETC"


class DiscountType(str, Enum):
    NONE = "NONE"
    PERCENT = "PERCENT"
    AMOUNT = "AMOUNT"


class DesignKey(str, Enum):
    CLASSIC = "classic"
    MODERN = "modern"
    COLOR = "color"


class PresetFrequency(str, Enum):
    WEEKLY_1 = "WEEKLY_1"
    WEEKLY_2 = "WEEKLY_2"
    WEEKLY_3 = "WEEKLY_3"
    WEEKLY_5 = "WEEKLY_5"
    DAILY = "DAILY"


DAYS_OF_WEEK = Literal["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]


class CustomerInfo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    phone: Annotated[str, StringConstraints(pattern=r"^01[0-9]-?\d{4}-?\d{4}$")]
    email: Optional[Annotated[str, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]] = None
    address: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    detail_address: Optional[Annotated[str, StringConstraints(max_length=100)]] = None
    building_type: BuildingType
    area_pyeong: Optional[Annotated[float, Field(ge=0)]] = None

    @field_validator("phone")
    @classmethod
    def format_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) == 11:
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        return v


class SupplierInfo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    biz_reg_no: Annotated[str, StringConstraints(pattern=r"^\d{10}$")]
    company_name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    ceo_name: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    address: Annotated[str, StringConstraints(min_length=1, max_length=200)]
    business_type: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    business_item: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    phone: Annotated[str, StringConstraints(pattern=r"^01[0-9]-?\d{4}-?\d{4}$|^02-?\d{3,4}-?\d{4}$|^0[3-9]{1,2}-?\d{3,4}-?\d{4}$")]
    email: Annotated[str, StringConstraints(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")]


class QuoteItemRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    area: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    task: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    days: Annotated[list[DAYS_OF_WEEK], Field(min_length=1)]
    qty: Annotated[int, Field(ge=1)]
    unit_price: Annotated[int, Field(ge=0)]
    exclude_area: Optional[Annotated[str, StringConstraints(max_length=100)]] = None
    memo: Optional[Annotated[str, StringConstraints(max_length=255)]] = None


class CalculationRequest(BaseModel):
    items: Annotated[list[QuoteItemRequest], Field(min_length=1)]
    discount_type: DiscountType = DiscountType.NONE
    discount_value: Annotated[int, Field(ge=0)] = 0
    vat_included: bool = False
    vat_rate: Annotated[float, Field(ge=0, le=1)] = 0.1


class QuoteCreateRequest(BaseModel):
    customer: CustomerInfo
    supplier: SupplierInfo
    calculation: CalculationRequest
    design_key: DesignKey = DesignKey.CLASSIC
    expires_days: Annotated[int, Field(ge=1, le=365)] = 30
    preset_frequency: Optional[PresetFrequency] = None


class QuoteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    sort_order: int
    area: str
    task: str
    days: list[str]
    qty: int
    unit_price: int
    total_price: int
    exclude_area: Optional[str] = None
    memo: Optional[str] = None


class TotalsResponse(BaseModel):
    subtotal: int
    discount_amount: int
    taxable_amount: int
    vat_amount: int
    grand_total: int


class QuotePreviewResponse(BaseModel):
    items: list[QuoteItemResponse]
    totals: TotalsResponse


class QuoteCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_number: str
    status: str
    public_url: str
    pdf_url: str
    expires_at: datetime
    watermark_text: str
    created_at: datetime


class QuoteViewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_number: str
    status: str
    customer_info: dict
    supplier_info: Optional[dict] = None
    items: list[QuoteItemResponse]
    totals: TotalsResponse
    design_key: str
    watermark_text: str
    expires_at: datetime
    created_at: datetime


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail