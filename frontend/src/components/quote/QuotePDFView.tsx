'use client';

import { formatNumber, formatDate, getDayLabel, getBuildingTypeLabel } from '@/lib/utils';
import type { QuoteViewResponse } from '@/types/quote';

interface QuotePDFViewProps {
  quote: QuoteViewResponse;
}

export default function QuotePDFView({ quote }: QuotePDFViewProps) {
  const designClass = `design-${quote.design_key}`;

  const renderItems = () => {
    return quote.items.map((item, index) => (
      <tr key={index}>
        <td className="text-center">{index + 1}</td>
        <td>{item.area}</td>
        <td>
          {item.task}
          {item.exclude_area && (
            <div className="text-xs text-gray-500 mt-1">제외: {item.exclude_area}</div>
          )}
          {item.memo && (
            <div className="text-xs text-gray-400 mt-1">{item.memo}</div>
          )}
        </td>
        <td className="text-center">
          {item.days.map((d) => getDayLabel(d)).join(', ')}
        </td>
        <td className="text-right">{formatNumber(item.price)}</td>
      </tr>
    ));
  };

  return (
    <html lang="ko" className={designClass}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>견적서 {quote.quote_number}</title>
        <link
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          ${getBaseCSS()}
          ${getDesignCSS(quote.design_key)}
          @page {
            size: A4;
            margin: 20mm 15mm 25mm 15mm;
            @bottom-center {
              content: "${quote.watermark_text}";
              font-size: 8pt;
              color: #ccc;
              font-family: "Noto Sans KR", "DejaVu Sans", sans-serif;
            }
          }
          body {
            padding: 20px;
            background: #f0f0f0;
            min-height: 100vh;
          }
          .quote-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
          }
          @media print {
            body { background: white; padding: 0; }
            .quote-container { box-shadow: none; padding: 0; max-width: none; }
            .no-print { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        <div className="quote-container">
          {renderHeader(quote)}
          {renderInfoBlocks(quote)}
          {renderItemsTable(quote)}
          {renderSummary(quote)}
          {renderFooter(quote)}
        </div>

        <div className="no-print fixed bottom-4 right-4 flex gap-2 z-50">
          <button
            onClick={() => window.print()}
            className="btn-primary px-6 py-3"
          >
            인쇄 / PDF 저장
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="btn-secondary px-6 py-3"
          >
            링크 복사
          </button>
        </div>
      </body>
    </html>
  );
}

function getBaseCSS() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body, "Pretendard", sans-serif); font-size: 9.5pt; line-height: 1.5; color: #1a1a2e; }
    .quote-container { width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--primary, #1a1a2e); }
    .header-left h1 { margin: 0 0 5px 0; font-size: 24pt; font-weight: 700; color: var(--primary, #1a1a2e); font-family: var(--font-heading, "Noto Serif KR", serif); }
    .header-left .quote-number { font-size: 10pt; color: #666; }
    .header-right { text-align: right; }
    .header-right .date { font-size: 9pt; color: #666; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
    .info-block { background: var(--bg-alt, #f8f9fa); padding: 12px 15px; border-radius: var(--radius, 4px); }
    .info-block h3 { margin: 0 0 8px 0; font-size: 9pt; font-weight: 600; color: var(--primary, #1a1a2e); text-transform: uppercase; letter-spacing: 0.5px; }
    .info-block p { margin: 3px 0; font-size: 9.5pt; color: #333; }
    .info-block .label { display: inline-block; width: 80px; color: #666; font-size: 9pt; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5pt; }
    .items-table th, .items-table td { padding: 8px 10px; text-align: left; border: 1px solid var(--border, #e0e0e0); }
    .items-table th { background: var(--primary, #1a1a2e); color: white; font-weight: 600; }
    .items-table tbody tr:nth-child(even) { background: var(--row-alt, #fafafa); }
    .items-table .text-right { text-align: right; }
    .items-table .text-center { text-align: center; }
    .summary { width: 300px; margin-left: auto; border: 1px solid var(--border, #e0e0e0); border-radius: var(--radius, 4px); overflow: hidden; }
    .summary-row { display: flex; justify-content: space-between; padding: 10px 15px; border-bottom: 1px solid var(--border, #e0e0e0); font-size: 9.5pt; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.total { background: var(--primary, #1a1a2e); color: white; font-weight: 700; font-size: 11pt; font-family: var(--font-heading, "Noto Serif KR", serif); }
    .summary-row .label { color: #666; }
    .summary-row.total .label, .summary-row.total .value { color: white; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid var(--border, #e0e0e0); font-size: 8pt; color: #999; text-align: center; }
    .validity { text-align: right; font-size: 8.5pt; color: #666; margin-top: 10px; }
  `;
}

function getDesignCSS(designKey: string) {
  const designs: Record<string, string> = {
    classic: `
      :root { --primary: #1a1a2e; --accent: #c49a6c; --bg-alt: #f5f5f0; --border: #d0d0c0; --row-alt: #fafaf5; --radius: 0; --font-heading: "Noto Serif KR", serif; --font-body: "Pretendard", sans-serif; }
      .info-block { border: 1px solid var(--border); }
      .items-table th { background: var(--primary); }
      .summary { border-color: var(--border); }
      .summary-row { border-color: var(--border); }
      .summary-row.total { background: var(--primary); }
      .footer { border-color: var(--border); }
    `,
    modern: `
      :root { --primary: #1d1d1f; --accent: #0071e3; --bg-alt: #f5f5f7; --border: #d2d2d7; --row-alt: #fbfbfd; --radius: 8px; --font-heading: "Pretendard", sans-serif; --font-body: "Pretendard", sans-serif; }
      .header { border-bottom: 1px solid var(--border); }
      .header-left h1 { font-size: 17pt; font-weight: 600; letter-spacing: -0.02em; }
      .info-block { box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-radius: var(--radius); }
      .items-table { border-radius: var(--radius); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      .items-table th { background: var(--primary); }
      .summary { box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-radius: var(--radius); }
      .summary-row.total { background: var(--primary); }
    `,
    color: `
      :root { --primary: #2e4057; --accent: #e85d75; --bg-alt: #f8f9fa; --border: #dee2e6; --row-alt: #f1f3f5; --radius: 12px; --font-heading: "Pretendard", sans-serif; --font-body: "Pretendard", sans-serif; }
      .header { border-bottom: 3px solid var(--primary); }
      .header-left h1 { font-size: 18pt; font-weight: 700; }
      .quote-number { background: #fff0f2; padding: 2px 8px; border-radius: 4px; color: var(--accent); }
      .info-block { box-shadow: 0 6px 24px rgba(46,64,87,0.08); border: 1px solid var(--border); border-radius: var(--radius); }
      .info-block h3 { border-bottom: 2px solid var(--accent); }
      .validity-date { background: linear-gradient(135deg, #fff0f2, #ffe8ec); padding: 12px 20px; border-radius: 8px; border: 1px solid var(--accent); }
      .items-table { border-radius: var(--radius); overflow: hidden; box-shadow: 0 6px 24px rgba(46,64,87,0.08); border: 1px solid var(--border); }
      .items-table th { background: linear-gradient(180deg, var(--primary), #3a4f6e); }
      .items-table tbody tr:hover { background: #fff5f6; }
      .summary { box-shadow: 0 6px 24px rgba(46,64,87,0.08); border-radius: var(--radius); }
      .summary-row.total { background: linear-gradient(180deg, var(--primary), #3a4f6e); }
      .footer { border-top: 2px solid var(--border); }
    `,
  };
  return designs[designKey] || designs.classic;
}

function renderHeader(quote: QuoteViewResponse) {
  return `
    <header class="quote-header">
      <div class="header">
        <div class="header-left">
          <h1>청소 견적서</h1>
          <div class="quote-number">견적번호: ${quote.quote_number}</div>
        </div>
        <div class="header-right">
          <div class="date">발행일: ${formatDate(quote.created_at)}</div>
        </div>
      </div>
    </header>
  `;
}

function renderInfoBlocks(quote: QuoteViewResponse) {
  const customer = quote.customer_info;
  const supplier = quote.supplier_info;

  return `
    <div class="info-grid">
      <div class="info-block">
        <h3>고객/현장 정보</h3>
        <p><span class="label">성함:</span> ${customer.name}</p>
        <p><span class="label">연락처:</span> ${customer.phone}</p>
        ${customer.email ? `<p><span class="label">이메일:</span> ${customer.email}</p>` : ''}
        <p><span class="label">주소:</span> ${customer.address} ${customer.detail_address || ''}</p>
        <p><span class="label">건물유형:</span> ${getBuildingTypeLabel(customer.building_type)}</p>
        ${customer.area_pyeong ? `<p><span class="label">평수:</span> ${customer.area_pyeong}평</p>` : ''}
      </div>
      <div class="info-block">
        <h3>공급자 정보</h3>
        <p><span class="label">상호:</span> ${supplier.company_name}</p>
        <p><span class="label">대표자:</span> ${supplier.ceo_name}</p>
        <p><span class="label">사업자등록번호:</span> ${supplier.biz_reg_no}</p>
        <p><span class="label">주소:</span> ${supplier.address}</p>
        <p><span class="label">업태/종목:</span> ${supplier.business_type} / ${supplier.business_item}</p>
        <p><span class="label">연락처:</span> ${supplier.phone}</p>
        <p><span class="label">이메일:</span> ${supplier.email}</p>
      </div>
    </div>
  `;
}

function renderItemsTable(quote: QuoteViewResponse) {
  const rows = quote.items.map((item, index) => `
    <tr>
      <td class="text-center">${index + 1}</td>
      <td>${item.area}</td>
      <td>${item.task.replace(/\n/g, '<br>')}${item.exclude_area ? `<br><small class="exclude">(제외: ${item.exclude_area})</small>` : ''}${item.memo ? `<br><small class="memo">${item.memo}</small>` : ''}</td>
      <td class="text-center">${item.days.map((d) => getDayLabel(d)).join(', ')}</td>
      <td class="text-right">${formatNumber(item.price)}</td>
    </tr>
  `).join('');

  return `
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
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderSummary(quote: QuoteViewResponse) {
  const totals = quote.totals;
  const calc = quote.calculation_snapshot;

  return `
    <div class="summary">
      <div class="summary-row">
        <span class="label">공급가액</span>
        <span class="value">${formatNumber(totals.subtotal)} 원</span>
      </div>
      ${totals.discount_amount > 0 ? `
      <div class="summary-row">
        <span class="label">할인금액 (${calc.discount_type === 'PERCENT' ? calc.discount_value + '%' : formatNumber(calc.discount_value) + '원'})</span>
        <span class="value">- ${formatNumber(totals.discount_amount)} 원</span>
      </div>
      ` : ''}
      <div class="summary-row">
        <span class="label">과세표준</span>
        <span class="value">${formatNumber(totals.taxable_amount)} 원</span>
      </div>
      <div class="summary-row">
        <span class="label">부가세 (${(calc.vat_rate * 100)}%)</span>
        <span class="value">${formatNumber(totals.vat_amount)} 원</span>
      </div>
      <div class="summary-row total">
        <span class="label">총 견적금액</span>
        <span class="value">${formatNumber(totals.grand_total)} 원</span>
      </div>
    </div>
  `;
}

function renderFooter(quote: QuoteViewResponse) {
  return `
    <footer class="quote-footer">
      <div class="validity">본 견적서는 ${formatDate(quote.expires_at)}까지 유효합니다.</div>
      <div>본 견적서는 율소프트 견적시스템을 통해 발행되었습니다.</div>
    </footer>
  `;
}