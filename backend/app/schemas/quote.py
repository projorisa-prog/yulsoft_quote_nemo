from __future__ import annotations

import re
from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Literal, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, field_validator
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
    phone: Optional[str] = ""
    email: Optional[str] = None
    address: Annotated[str, StringConstraints(max_length=200)] = ""
    detail_address: Optional[Annotated[str, StringConstraints(max_length=100)]] = None
    building_type: BuildingType = BuildingType.OFFICE
    area_pyeong: Optional[float] = None

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone(cls, v: Any) -> str:
        if not v:
            return ""
        v_str = str(v).strip()
        digits = re.sub(r"\D", "", v_str)
        if len(digits) == 11:
            return f"{digits[:3]}-{digits[3:7]}-{digits[7:]}"
        return v_str

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, v: Any) -> Optional[str]:
        if not v or str(v).strip() == "":
            return None
        v_str = str(v).strip()
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v_str):
            raise ValueError("올바른 이메일 형식이 아닙니다.")
        return v_str

    @field_validator("building_type", mode="before")
    @classmethod
    def validate_building_type(cls, v: Any) -> BuildingType:
        if not v or str(v).strip() == "":
            return BuildingType.OFFICE
        if isinstance(v, BuildingType):
            return v
        try:
            return BuildingType(str(v).upper())
        except ValueError:
            return BuildingType.OFFICE

    @field_validator("area_pyeong", mode="before")
    @classmethod
    def validate_area_pyeong(cls, v: Any) -> Optional[float]:
        if v is None or str(v).strip() == "":
            return None
        try:
            val = float(v)
            return val if val >= 0 else None
        except (ValueError, TypeError):
            return None


class SupplierInfo(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    biz_reg_no: Optional[str] = ""
    company_name: Annotated[str, StringConstraints(min_length=1, max_length=100)] = "율소프트"
    ceo_name: Annotated[str, StringConstraints(min_length=1, max_length=50)] = "홍길동"
    address: Annotated[str, StringConstraints(min_length=1, max_length=200)] = "서울특별시 강남구 테헤란로 123"
    business_type: Annotated[str, StringConstraints(min_length=1, max_length=100)] = "서비스업"
    business_item: Annotated[str, StringConstraints(min_length=1, max_length=100)] = "소프트웨어 개발 및 공급"
    phone: Optional[str] = "02-1234-5678"
    email: Optional[str] = "contact@yulsoft.kr"

    @field_validator("biz_reg_no", mode="before")
    @classmethod
    def validate_biz_reg_no(cls, v: Any) -> str:
        if not v:
            return ""
        return re.sub(r"\D", "", str(v))

    @field_validator("phone", mode="before")
    @classmethod
    def validate_supplier_phone(cls, v: Any) -> str:
        if not v:
            return ""
        return str(v).strip()

    @field_validator("email", mode="before")
    @classmethod
    def validate_supplier_email(cls, v: Any) -> str:
        if not v or str(v).strip() == "":
            return "contact@yulsoft.kr"
        return str(v).strip()


class QuoteItemRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, populate_by_name=True)

    area: Annotated[str, StringConstraints(min_length=1, max_length=50)]
    task: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    days: Annotated[list[DAYS_OF_WEEK], Field(min_length=1)]
    price: Annotated[int, Field(ge=0, validation_alias=AliasChoices("price", "unit_price"))]
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