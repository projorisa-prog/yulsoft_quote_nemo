from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path

from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

from app.core.config import settings
from app.models.quote import Quote
from app.models.quote_item import QuoteItem
from app.schemas.quote import CalculationRequest, DesignKey, QuoteCreateRequest, QuoteItemRequest, QuoteItemResponse, TotalsResponse


class PDFService:
    BASE_DIR = Path(__file__).parent.parent / "templates"
    STATIC_DIR = BASE_DIR / "static"
    FONTS_DIR = BASE_DIR / "fonts"

    WATERMARK_TEXT = "Powered by 율소프트 | www.yulsoft.kr"

    DESIGN_CSS_MAP = {
        DesignKey.CLASSIC: "design-classic.css",
        DesignKey.MODERN: "design-modern.css",
        DesignKey.COLOR: "design-color.css",
    }

    def __init__(self):
        self.font_config = FontConfiguration()
        self._ensure_dirs()

    def _ensure_dirs(self):
        self.STATIC_DIR.mkdir(parents=True, exist_ok=True)
        self.FONTS_DIR.mkdir(parents=True, exist_ok=True)

    def _get_base_css(self) -> str:
        return """
@page {
    size: A4;
    margin: 20mm 15mm 25mm 15mm;
    @bottom-center {
        content: "POWERED BY 율소프트 | www.yulsoft.kr";
        font-size: 8pt;
        color: #999;
        font-family: "Pretendard", sans-serif;
    }
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: var(--font-body, "Pretendard", sans-serif);
    font-size: 10pt;
    line-height: 1.5;
    color: #1a1a2e;
}

.quote-container {
    width: 100%;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid var(--primary-color, #1a1a2e);
}

.header-left h1 {
    margin: 0 0 5px 0;
    font-size: 24pt;
    font-weight: 700;
    color: var(--primary-color, #1a1a2e);
    font-family: var(--font-heading, "Noto Serif KR", serif);
}

.header-left .quote-number {
    font-size: 10pt;
    color: #666;
    font-family: var(--font-body, "Pretendard", sans-serif);
}

.header-right {
    text-align: right;
}

.header-right .date {
    font-size: 9pt;
    color: #666;
    margin-bottom: 10px;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

.info-block {
    background: var(--bg-alt, #f8f9fa);
    padding: 12px 15px;
    border-radius: var(--radius, 4px);
}

.info-block h3 {
    margin: 0 0 8px 0;
    font-size: 9pt;
    font-weight: 600;
    color: var(--primary-color, #1a1a2e);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: var(--font-body, "Pretendard", sans-serif);
}

.info-block p {
    margin: 3px 0;
    font-size: 9.5pt;
    color: #333;
}

.info-block .label {
    display: inline-block;
    width: 80px;
    color: #666;
    font-size: 9pt;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 9.5pt;
}

.items-table th,
.items-table td {
    padding: 8px 10px;
    text-align: left;
    border: 1px solid var(--border-color, #e0e0e0);
}

.items-table th {
    background: var(--primary-color, #1a1a2e);
    color: white;
    font-weight: 600;
    font-family: var(--font-body, "Pretendard", sans-serif);
}

.items-table tbody tr:nth-child(even) {
    background: var(--row-alt, #fafafa);
}

.items-table .text-right {
    text-align: right;
}

.items-table .text-center {
    text-align: center;
}

.summary {
    width: 300px;
    margin-left: auto;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: var(--radius, 4px);
    overflow: hidden;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    font-size: 9.5pt;
}

.summary-row:last-child {
    border-bottom: none;
}

.summary-row.total {
    background: var(--primary-color, #1a1a2e);
    color: white;
    font-weight: 700;
    font-size: 11pt;
    font-family: var(--font-heading, "Noto Serif KR", serif);
}

.summary-row .label {
    color: #666;
}

.summary-row.total .label,
.summary-row.total .value {
    color: white;
}

.footer {
    margin-top: 30px;
    padding-top: 15px;
    border-top: 1px solid var(--border-color, #e0e0e0);
    font-size: 8pt;
    color: #999;
    text-align: center;
    font-family: var(--font-body, "Pretendard", sans-serif);
}

.validity {
    text-align: right;
    font-size: 8.5pt;
    color: #666;
    margin-top: 10px;
}

.exclude-area,
.memo {
    font-size: 8pt;
    color: #888;
    margin-top: 2px;
}
"""

    def _get_design_css(self, design_key: DesignKey) -> str:
        css_file = self.DESIGN_CSS_MAP.get(design_key, "design-classic.css")
        css_path = self.STATIC_DIR / css_file
        if css_path.exists():
            return css_path.read_text(encoding="utf-8")
        return self._get_default_design_css(design_key)

    def _get_default_design_css(self, design_key: DesignKey) -> str:
        designs = {
            DesignKey.CLASSIC: """
:root {
    --primary-color: #1a1a2e;
    --accent-color: #c49a6c;
    --bg-alt: #f5f5f0;
    --border-color: #d0d0c0;
    --row-alt: #fafaf5;
    --radius: 0;
    --font-heading: "Noto Serif KR", serif;
    --font-body: "Pretendard", sans-serif;
}
""",
            DesignKey.MODERN: """
:root {
    --primary-color: #1d1d1f;
    --accent-color: #0071e3;
    --bg-alt: #f5f5f7;
    --border-color: #d2d2d7;
    --row-alt: #fbfbfd;
    --radius: 8px;
    --font-heading: "Pretendard", sans-serif;
    --font-body: "Pretendard", sans-serif;
}
""",
            DesignKey.COLOR: """
:root {
    --primary-color: #2e4057;
    --accent-color: #e85d75;
    --bg-alt: #f8f9fa;
    --border-color: #dee2e6;
    --row-alt: #f1f3f5;
    --radius: 12px;
    --font-heading: "Pretendard", sans-serif;
    --font-body: "Pretendard", sans-serif;
}
""",
        }
        return designs.get(design_key, designs[DesignKey.CLASSIC])

    def _render_header(self, quote: Quote) -> str:
        return f"""
<div class="header">
    <div class="header-left">
        <h1>청소 견적서</h1>
        <div class="quote-number">견적번호: {quote.quote_number}</div>
    </div>
    <div class="header-right">
        <div class="date">발행일: {quote.created_at.strftime('%Y년 %m월 %d일')}</div>
    </div>
</div>
"""

    def _render_info_blocks(self, quote: Quote) -> str:
        customer = quote.customer_info
        supplier = quote.supplier_info

        return f"""
<div class="info-grid">
    <div class="info-block">
        <h3>고객/현장 정보</h3>
        <p><span class="label">성명:</span> {customer.get('name', '')}</p>
        <p><span class="label">연락처:</span> {customer.get('phone', '')}</p>
        {f'<p><span class="label">이메일:</span> {customer.get("email", "")}</p>' if customer.get('email') else ''}
        <p><span class="label">주소:</span> {customer.get('address', '')} {customer.get('detail_address', '')}</p>
        <p><span class="label">건물유형:</span> {customer.get('building_type', '')}</p>
        {f'<p><span class="label">면적:</span> {customer.get("area_pyeong", "")}평</p>' if customer.get('area_pyeong') else ''}
    </div>
    <div class="info-block">
        <h3>공급자 정보</h3>
        <p><span class="label">상호:</span> {supplier.get('company_name', '')}</p>
        <p><span class="label">대표자:</span> {supplier.get('ceo_name', '')}</p>
        <p><span class="label">사업자등록번호:</span> {supplier.get('biz_reg_no', '')}</p>
        <p><span class="label">주소:</span> {supplier.get('address', '')}</p>
        <p><span class="label">업태/종목:</span> {supplier.get('business_type', '')} / {supplier.get('business_item', '')}</p>
        <p><span class="label">연락처:</span> {supplier.get('phone', '')}</p>
        <p><span class="label">이메일:</span> {supplier.get('email', '')}</p>
    </div>
</div>
"""

    def _render_items_table(self, items: list[QuoteItem]) -> str:
        rows = []
        for idx, item in enumerate(items, 1):
            days_str = ", ".join(item.days)
            exclude = f'<div class="exclude-area">제외: {item.exclude_area}</div>' if item.exclude_area else ""
            memo = f'<div class="memo">{item.memo}</div>' if item.memo else ""

            # Use unit_price as price (since qty=1, unit_price=price, total_price=price)
            price = item.unit_price

            rows.append(f"""
<tr>
    <td class="text-center">{idx}</td>
    <td>{item.area}</td>
    <td>{item.task}</td>
    <td class="text-center">{days_str}</td>
    <td class="text-right">{price:,}</td>
</tr>
<tr>
    <td colspan="5">{exclude}{memo}</td>
</tr>
""")

        return f"""
<table class="items-table">
    <thead>
        <tr>
            <th class="text-center" style="width: 40px;">No.</th>
            <th style="width: 100px;">구역</th>
            <th>청소내용</th>
            <th style="width: 120px;">요일</th>
            <th class="text-right" style="width: 100px;">금액</th>
        </tr>
    </thead>
    <tbody>
        {''.join(rows)}
    </tbody>
</table>
"""

    def _render_summary(self, totals: TotalsResponse) -> str:
        return f"""
<div class="summary">
    <div class="summary-row">
        <span class="label">공급가액</span>
        <span class="value">{totals.subtotal:,} 원</span>
    </div>
    <div class="summary-row">
        <span class="label">할인금액</span>
        <span class="value">- {totals.discount_amount:,} 원</span>
    </div>
    <div class="summary-row">
        <span class="label">과세금액</span>
        <span class="value">{totals.taxable_amount:,} 원</span>
    </div>
    <div class="summary-row">
        <span class="label">부가세 (10%)</span>
        <span class="value">{totals.vat_amount:,} 원</span>
    </div>
    <div class="summary-row total">
        <span class="label">총 견적금액</span>
        <span class="value">{totals.grand_total:,} 원</span>
    </div>
</div>
"""

    def _render_footer(self, quote: Quote) -> str:
        expires_str = quote.expires_at.strftime('%Y년 %m월 %d일')
        return f"""
<div class="footer">
    <div class="validity">본 견적서는 {expires_str}까지 유효합니다.</div>
    <div>본 견적서는 율소프트 견적시스템을 통해 발행되었습니다.</div>
</div>
"""

    def generate_pdf(self, quote: Quote, items: list[QuoteItem]) -> bytes:
        totals = TotalsResponse(
            subtotal=quote.totals["subtotal"],
            discount_amount=quote.totals["discount_amount"],
            taxable_amount=quote.totals["taxable_amount"],
            vat_amount=quote.totals["vat_amount"],
            grand_total=quote.totals["grand_total"],
        )

        html_content = f"""
<!DOCTYPE html>
<html class="design-{quote.design_key.value}">
<head>
    <meta charset="UTF-8">
    <style>
        {self._get_base_css()}
        {self._get_design_css(quote.design_key)}
    </style>
</head>
<body>
    <div class="quote-container">
        {self._render_header(quote)}
        {self._render_info_blocks(quote)}
        {self._render_items_table(items)}
        {self._render_summary(totals)}
        {self._render_footer(quote)}
    </div>
</body>
</html>
"""

        html = HTML(string=html_content, base_url=str(self.BASE_DIR))
        pdf_bytes = html.write_pdf(
            stylesheets=[],
            font_config=self.font_config,
            presentational_hints=True,
        )
        return pdf_bytes

    def generate_preview_pdf(self, request: QuoteCreateRequest) -> bytes:
        totals = calculation_service.calculate_totals(request.calculation)

        quote_data = {
            "quote_number": f"TEMP-{uuid.uuid4().hex[:8].upper()}",
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=request.expires_days),
            "design_key": request.design_key,
            "customer_info": request.customer.model_dump(),
            "supplier_info": request.supplier.model_dump(),
            "totals": totals.model_dump(),
        }

        class TempQuote:
            def __init__(self, data):
                self.__dict__.update(data)
                self.design_key = data["design_key"]

        class TempItem:
            def __init__(self, item_req: QuoteItemRequest, idx: int):
                self.sort_order = idx
                self.area = item_req.area
                self.task = item_req.task
                self.days = item_req.days
                self.qty = 1
                self.unit_price = item_req.price
                self.total_price = item_req.price
                self.exclude_area = item_req.exclude_area
                self.memo = item_req.memo

        temp_quote = TempQuote(quote_data)
        temp_items = [TempItem(item, i + 1) for i, item in enumerate(request.calculation.items)]

        return self.generate_pdf(temp_quote, temp_items)


pdf_service = PDFService()