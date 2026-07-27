from __future__ import annotations

import pytest
from decimal import Decimal, ROUND_HALF_UP

from app.services.calculation import CalculationService
from app.schemas.quote import CalculationRequest, QuoteItemRequest, DiscountType


class TestCalculationService:
    """산출 엔진 단위 테스트"""

    def setup_method(self):
        self.service = CalculationService()

    def test_calculate_item_total(self):
        """품목별 금액 = 수량 × 단가"""
        item = QuoteItemRequest(
            area="거실",
            task="청소",
            days=["MON", "WED", "FRI"],
            qty=2,
            unit_price=50000,
        )
        assert self.service.calculate_item_total(item) == 100000

    def test_calculate_subtotal(self):
        """공급가액 합계 = Σ(품목별 금액)"""
        items = [
            QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=1, unit_price=50000),
            QuoteItemRequest(area="화장실", task="청소", days=["TUE"], qty=2, unit_price=30000),
        ]
        assert self.service.calculate_subtotal(items) == 110000

    def test_calculate_discount_none(self):
        """할인 없음"""
        assert self.service.calculate_discount(100000, "NONE", 0) == 0
        assert self.service.calculate_discount(100000, "NONE", 10) == 0

    def test_calculate_discount_percent(self):
        """비율 할인: floor(공급가액 × 할인율 / 100)"""
        assert self.service.calculate_discount(100000, "PERCENT", 10) == 10000
        assert self.service.calculate_discount(100000, "PERCENT", 15) == 15000
        # 반올림 테스트: 100000 * 33 / 100 = 33000
        assert self.service.calculate_discount(100000, "PERCENT", 33) == 33000
        # 0.5 올림 테스트: 100000 * 16.5 / 100 = 16500
        assert self.service.calculate_discount(100000, "PERCENT", 16.5) == 16500

    def test_calculate_discount_amount(self):
        """금액 할인: min(할인금액, 공급가액)"""
        assert self.service.calculate_discount(100000, "AMOUNT", 20000) == 20000
        assert self.service.calculate_discount(50000, "AMOUNT", 100000) == 50000

    def test_calculate_vat_excluded(self):
        """부가세 별도: 과세금액 × 0.1 반올림"""
        assert self.service.calculate_vat(100000, 0.1, False) == 10000
        assert self.service.calculate_vat(54000, 0.1, False) == 5400
        # 반올림 테스트: 54500 * 0.1 = 5450
        assert self.service.calculate_vat(54500, 0.1, False) == 5450

    def test_calculate_vat_included(self):
        """부가세 포함: 과세금액 × 0.1 / 1.1 반올림"""
        # 110000 * 0.1 / 1.1 = 10000
        assert self.service.calculate_vat(110000, 0.1, True) == 10000
        # 59400 * 0.1 / 1.1 = 5400
        assert self.service.calculate_vat(59400, 0.1, True) == 5400

    def test_calculate_totals_basic(self):
        """기본 계산 흐름 테스트"""
        request = CalculationRequest(
            items=[
                QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=2, unit_price=50000),
                QuoteItemRequest(area="화장실", task="청소", days=["TUE"], qty=1, unit_price=30000),
            ],
            discount_type=DiscountType.NONE,
            discount_value=0,
            vat_included=False,
            vat_rate=0.1,
        )
        totals = self.service.calculate_totals(request)
        assert totals.subtotal == 130000
        assert totals.discount_amount == 0
        assert totals.taxable_amount == 130000
        assert totals.vat_amount == 13000
        assert totals.grand_total == 143000

    def test_calculate_totals_with_percent_discount(self):
        """비율 할인 적용"""
        request = CalculationRequest(
            items=[
                QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=1, unit_price=100000),
            ],
            discount_type=DiscountType.PERCENT,
            discount_value=10,
            vat_included=False,
            vat_rate=0.1,
        )
        totals = self.service.calculate_totals(request)
        assert totals.subtotal == 100000
        assert totals.discount_amount == 10000
        assert totals.taxable_amount == 90000
        assert totals.vat_amount == 9000
        assert totals.grand_total == 99000

    def test_calculate_totals_with_amount_discount(self):
        """금액 할인 적용"""
        request = CalculationRequest(
            items=[
                QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=1, unit_price=100000),
            ],
            discount_type=DiscountType.AMOUNT,
            discount_value=15000,
            vat_included=False,
            vat_rate=0.1,
        )
        totals = self.service.calculate_totals(request)
        assert totals.subtotal == 100000
        assert totals.discount_amount == 15000
        assert totals.taxable_amount == 85000
        assert totals.vat_amount == 8500
        assert totals.grand_total == 93500

    def test_calculate_totals_vat_included(self):
        """부가세 포함 모드"""
        request = CalculationRequest(
            items=[
                QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=1, unit_price=110000),
            ],
            discount_type=DiscountType.NONE,
            discount_value=0,
            vat_included=True,
            vat_rate=0.1,
        )
        totals = self.service.calculate_totals(request)
        assert totals.subtotal == 110000
        assert totals.discount_amount == 0
        assert totals.taxable_amount == 110000
        assert totals.vat_amount == 10000  # 110000 * 0.1 / 1.1
        assert totals.grand_total == 110000  # 부가세 포함이라 총액 동일

    def test_calculate_totals_discount_capped_at_subtotal(self):
        """할인금액이 공급가액을 초과할 수 없음"""
        request = CalculationRequest(
            items=[
                QuoteItemRequest(area="거실", task="청소", days=["MON"], qty=1, unit_price=50000),
            ],
            discount_type=DiscountType.AMOUNT,
            discount_value=100000,
            vat_included=False,
            vat_rate=0.1,
        )
        totals = self.service.calculate_totals(request)
        assert totals.discount_amount == 50000
        assert totals.taxable_amount == 0
        assert totals.vat_amount == 0
        assert totals.grand_total == 0

    def test_round_half_up(self):
        """ROUND_HALF_UP 검증"""
        # 0.5 올림
        assert self.service.calculate_vat(10050, 0.1, False) == 1005
        assert self.service.calculate_vat(10040, 0.1, False) == 1004
        assert self.service.calculate_vat(10049, 0.1, False) == 1005