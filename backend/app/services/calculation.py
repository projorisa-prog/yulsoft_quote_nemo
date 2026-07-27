from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import TYPE_CHECKING

from app.schemas.quote import CalculationRequest, QuoteItemRequest, TotalsResponse

if TYPE_CHECKING:
    from app.models.quote_item import QuoteItem


class CalculationService:
    VAT_RATE = Decimal("0.1")

    @staticmethod
    def calculate_item_total(item: QuoteItemRequest) -> int:
        return item.qty * item.unit_price

    @classmethod
    def calculate_subtotal(cls, items: list[QuoteItemRequest]) -> int:
        return sum(cls.calculate_item_total(item) for item in items)

    @classmethod
    def calculate_discount(
        cls, subtotal: int, discount_type: str, discount_value: int
    ) -> int:
        if discount_type == "NONE" or discount_value == 0:
            return 0
        if discount_type == "PERCENT":
            return int((Decimal(subtotal) * Decimal(discount_value) / Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        if discount_type == "AMOUNT":
            return min(discount_value, subtotal)
        return 0

    @classmethod
    def calculate_vat(cls, taxable_amount: int, vat_rate: float, vat_included: bool) -> int:
        rate = Decimal(str(vat_rate))
        if vat_included:
            vat_amount = (Decimal(taxable_amount) * rate / (Decimal(1) + rate)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        else:
            vat_amount = (Decimal(taxable_amount) * rate).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        return int(vat_amount)

    @classmethod
    def calculate_totals(cls, request: CalculationRequest) -> TotalsResponse:
        subtotal = cls.calculate_subtotal(request.items)
        discount_amount = cls.calculate_discount(subtotal, request.discount_type, request.discount_value)
        taxable_amount = subtotal - discount_amount
        vat_amount = cls.calculate_vat(taxable_amount, request.vat_rate, request.vat_included)
        
        # 부가세 포함 모드일 때: 총액 = 과세금액 (이미 부가세 포함)
        # 부가세 별도 모드일 때: 총액 = 과세금액 + 부가세
        if request.vat_included:
            grand_total = taxable_amount
        else:
            grand_total = taxable_amount + vat_amount

        return TotalsResponse(
            subtotal=subtotal,
            discount_amount=discount_amount,
            taxable_amount=taxable_amount,
            vat_amount=vat_amount,
            grand_total=grand_total,
        )

    @classmethod
    def calculate_from_db_items(cls, items: list[QuoteItem]) -> TotalsResponse:
        subtotal = sum(item.total_price for item in items)
        discount_amount = 0
        taxable_amount = subtotal - discount_amount
        vat_amount = cls.calculate_vat(taxable_amount, float(cls.VAT_RATE), False)
        grand_total = taxable_amount + vat_amount

        return TotalsResponse(
            subtotal=subtotal,
            discount_amount=discount_amount,
            taxable_amount=taxable_amount,
            vat_amount=vat_amount,
            grand_total=grand_total,
        )


calculation_service = CalculationService()