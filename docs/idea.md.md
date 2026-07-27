# Phase 1: 미끼 상품 MVP Core

> 목표: 로그인 없이 `[조건 입력 → 애플풍 UI 견적서 확인 → PDF 다운로드(워터마크 포함)]` 기능을 최우선 개발 및 배포
> 기간: 1~2주
> 핵심 지표: 시장 반응, 트래픽, 무료 견적 생성 건수

---

## 1. 개발 범위

### 1.1 포함 기능

| 기능 | 설명 | 우선순위 |
|------|------|:--------:|
| 랜딩 페이지 | Hero 섹션 + 무료 견적서 만들기 CTA | P0 |
| 견적 입력 Stepper | 4단계 폼 (고객정보 → 항목구성 → 산출확인 → 디자인선택) | P0 |
| 산출 엔진 | 결정론적 계산, 원 단위 정수 연산, 부가세 반올림 | P0 |
| PDF 생성 | WeasyPrint 기반, 3종 디자인, 워터마크 강제 삽입 | P0 |
| 견적서 공유 | Public URL + PDF 다운로드 | P0 |
| 프리셋 버튼 | 주 1회/2회/3회/5회/매일 → 요일 자동 체크 | P1 |
| 실시간 미리보기 | 디자인 선택 시 서버 미리보기 이미지 생성 | P1 |

### 1.2 제외 기능 (Phase 2~3에서 구현)

- 회원가입 / 로그인
- 데이터 영구 저장 (DB는 사용하지만 회원 연동 없음)
- 템플릿 기능
- 워터마크 제거
- 계약서 변환
- 결제 연동
- 관리자 기능

---

## 2. 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| Backend | FastAPI | 비동기 처리, 자동 Swagger 문서, 생산성 |
| DB | PostgreSQL | JSONB 지원, 향후 확장성 |
| ORM | SQLAlchemy 2.0 | Async 지원, 타입 힌트 |
| PDF | WeasyPrint | CSS Paged Media, 애플 스타일 구현 용이 |
| Frontend | Next.js 14 | SSR, SEO, React 기반 |
| Styling | Tailwind CSS | 빠른 UI 개발 |
| State | Zustand | 경량 상태관리 |
| Infra | Docker + Docker Compose | 로컬 개발 환경 통일 |

---

## 3. DB 스키마 (Phase 1)

### 3.1 ERD

QUOTE (1) ──* QUOTE_ITEM

### 3.2 quote 테이블

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | Public ID (URL용) |
| quote_number | VARCHAR(20) | UK, NOT NULL | - | TEMP-{uuid 앞 8자리} |
| status | ENUM | NOT NULL | DRAFT | DRAFT, COMPLETED, EXPIRED |
| customer_info | JSONB | NOT NULL | - | 고객/현장 정보 |
| supplier_info | JSONB | | - | 공급자 정보 (비회원 입력) |
| calculation_snapshot | JSONB | NOT NULL | - | 산출 입력값 |
| totals | JSONB | NOT NULL | - | {subtotal, discount_amount, taxable_amount, vat_amount, grand_total} |
| watermark_text | VARCHAR(100) | NOT NULL | Powered by 율소프트 | www.yulsoft.kr |
| design_key | VARCHAR(20) | NOT NULL | classic | classic, modern, color |
| expires_at | TIMESTAMPTZ | NOT NULL | NOW() + 30일 | |
| created_at | TIMESTAMPTZ | NOT NULL | NOW() | |
| updated_at | TIMESTAMPTZ | NOT NULL | NOW() | |

### 3.3 quote_item 테이블

| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | |
| quote_id | UUID | FK → quote, CASCADE | |
| sort_order | INTEGER | NOT NULL | 표시 순서 |
| area | VARCHAR(50) | NOT NULL | 청소 구역 |
| task | VARCHAR(100) | NOT NULL | 청소 내용 |
| days | JSONB | NOT NULL | [MON, WED, FRI] |
| qty | INTEGER | NOT NULL, CHECK >= 1 | 수량/횟수 |
| unit_price | INTEGER | NOT NULL, CHECK >= 0 | 단가 (원) |
| total_price | INTEGER | NOT NULL | qty * unit_price |
| exclude_area | VARCHAR(100) | | 제외 구역 |
| memo | VARCHAR(255) | | 비고 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |

### 3.4 인덱스

```sql
CREATE UNIQUE INDEX idx_quote_number ON quote(quote_number);
CREATE INDEX idx_quote_expires_status ON quote(expires_at, status);
CREATE INDEX idx_quote_item_quote_id ON quote_item(quote_id);
```

---

## 4. API 명세

### 4.1 POST /api/v1/quotes/preview
견적 산출 미리보기 (DB 저장 없음)

**Request Body (QuoteCreateRequest):**

```json
{
  "customer": {
    "name": "string (required)",
    "phone": "string, pattern: ^01[0-9]-?\\d{4}-?\\d{4}$",
    "email": "string (optional)",
    "address": "string (required)",
    "detail_address": "string (optional)",
    "building_type": "enum: APT, OFFICETEL, OFFICE, STORE, FACTORY, ETC",
    "area_pyeong": "number (optional)"
  },
  "supplier": {
    "biz_reg_no": "string, pattern: ^\\d{10}$",
    "company_name": "string",
    "ceo_name": "string",
    "address": "string",
    "business_type": "string",
    "business_item": "string",
    "phone": "string",
    "email": "string (email)"
  },
  "calculation": {
    "items": [
      {
        "area": "string",
        "task": "string",
        "days": ["MON", "WED", "FRI"],
        "qty": "integer >= 1",
        "unit_price": "integer >= 0",
        "exclude_area": "string (optional)",
        "memo": "string (optional)"
      }
    ],
    "discount_type": "enum: NONE, PERCENT, AMOUNT (default: NONE)",
    "discount_value": "integer >= 0 (default: 0)",
    "vat_included": "boolean (default: false)",
    "vat_rate": "number (default: 0.1)"
  },
  "design_key": "enum: classic, modern, color (default: classic)",
  "expires_days": "integer 1~365 (default: 30)",
  "preset_frequency": "enum: WEEKLY_1, WEEKLY_2, WEEKLY_3, WEEKLY_5, DAILY (optional)"
}
```

**Response 200:**

```json
{
  "items": [...],
  "totals": {
    "subtotal": 600000,
    "discount_amount": 60000,
    "taxable_amount": 540000,
    "vat_amount": 54000,
    "grand_total": 594000
  }
}
```

Rate Limit: 30/min (IP 기준)

---

### 4.2 POST /api/v1/quotes
견적서 생성 및 저장 (PDF 생성 트리거)

**Request:** QuoteCreateRequest (preview와 동일)

**Response 201:**

```json
{
  "id": "uuid",
  "quote_number": "TEMP-a1b2c3d4",
  "status": "COMPLETED",
  "public_url": "https://yulsoft.kr/q/{id}",
  "pdf_url": "https://yulsoft.kr/api/v1/quotes/{id}/pdf",
  "expires_at": "2026-08-21T06:14:00+09:00",
  "watermark_text": "Powered by 율소프트 | www.yulsoft.kr",
  "created_at": "2026-07-22T06:14:00+09:00"
}
```

Rate Limit: 10/min (IP 기준)

---

### 4.3 GET /api/v1/quotes/{public_id}
견적서 웹뷰 조회

**Path Param:** public_id (UUID)
**Query Param:** format = json | html (default: html)

**Response 200** (JSON):

```json
{
  "id": "uuid",
  "quote_number": "TEMP-xxx",
  "status": "COMPLETED",
  "customer_info": { ... },
  "supplier_info": { ... },
  "items": [ ... ],
  "totals": { ... },
  "design_key": "modern",
  "watermark_text": "Powered by 율소프트",
  "expires_at": "...",
  "created_at": "..."
}
```

Rate Limit: 60/min (IP 기준)

---

### 4.4 GET /api/v1/quotes/{public_id}/pdf
PDF 다운로드

**Response:** Content-Type: application/pdf

- watermark_text가 비어있지 않으면 PDF 하단 중앙에 워터마크 삽입
- 워터마크 CSS: @page { @bottom-center { content: "..."; font-size: 8pt; color: #ccc; } }

Rate Limit: 20/min (IP 기준)

---

### 4.5 에러 응답 표준

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값 검증에 실패했습니다.",
    "details": { "customer.phone": "유효한 전화번호 형식이 아닙니다." }
  }
}
```

| HTTP Status | Error Code | 설명 |
|-------------|-----------|------|
| 400 | VALIDATION_ERROR | 입력값 검증 실패 |
| 404 | QUOTE_NOT_FOUND | 견적서 없음 |
| 429 | RATE_LIMITED | 요청 제한 초과 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |

---

## 5. 산출 엔진 명세

### 5.1 계산 규칙

```
1. 품목별 금액: item.total_price = item.qty * item.unit_price
2. 공급가액 합계: subtotal = SUM(item.total_price)
3. 할인 계산:
   - PERCENT: discount_amount = floor(subtotal * discount_value / 100)
   - AMOUNT: discount_amount = min(discount_value, subtotal)
   - NONE: discount_amount = 0
4. 과세금액: taxable_amount = subtotal - discount_amount
5. 부가세: vat_amount = round(taxable_amount * vat_rate)  // ROUND_HALF_UP
6. 총액: grand_total = taxable_amount + vat_amount
```

### 5.2 정수 연산 규칙

- 모든 금액은 원 단위 정수로 처리
- Decimal 타입 사용하여 부동소수점 오차 방지
- 반올림: ROUND_HALF_UP (0.5 올림)

---

## 6. PDF 디자인 시스템

### 6.1 아키텍처

HTML Template (Jinja2) + CSS Variables + design-{key}.css -> WeasyPrint -> PDF

### 6.2 디자인 3종

| Design Key | 컨셉 | 주요 CSS 변수 |
|-----------|------|--------------|
| classic | 신뢰/관공서 | --primary: #1a1a2e; --accent: #c49a6c; --radius: 0; --font-heading: Noto Serif KR |
| modern | 애플 스타일 | --primary: #1d1d1f; --accent: #0071e3; --radius: 8px; --shadow: 0 4px 20px rgba(0,0,0,0.05); --font-heading: Pretendard |
| color | 젊은 감각 | --primary: #2e4057; --accent: #e85d75; --radius: 12px; --bg-alt: #f8f9fa |

### 6.3 공통 템플릿 구조

```html
<html class="design-{{ design_key }}">
<head>
  <link rel="stylesheet" href="quote-base.css">
  <link rel="stylesheet" href="design-{{ design_key }}.css">
  <style>
    @page { @bottom-center { content: "{{ watermark_text }}"; font-size: 8pt; color: #ccc; } }
  </style>
</head>
<body>
  {% include "partials/header.html" %}
  {% include "partials/supplier.html" %}
  {% include "partials/customer.html" %}
  {% include "partials/items_table.html" %}
  {% include "partials/summary.html" %}
  {% include "partials/footer.html" %}
</body>
</html>
```

### 6.4 워터마크 전략

- 비회원/무료: "Powered by 율소프트 | www.yulsoft.kr" 강제 삽입
- 워터마크는 @page @bottom-center CSS로 삽입 (PDF에서 제거 불가)
- 유료 회원: Phase 2에서 watermark_text = "" 로 업데이트 시 워터마크 영역 미렌더링

---

## 7. 프론트엔드 화면설계

### 7.1 화면 목록

| 화면 ID | 화면명 | 경로 | 설명 |
|---------|--------|------|------|
| SCR-001 | 랜딩 페이지 | / | Hero + CTA |
| SCR-002 | 견적 입력 Stepper | /quote/create | 4단계 입력 폼 |
| SCR-003 | 견적서 완료 | /quote/complete?id={id} | PDF 다운로드 + 공유 |
| SCR-004 | 견적서 웹뷰 | /q/{public_id} | 공유용 웹뷰 |

### 7.2 Stepper 상세

**Step 1: 고객/현장 정보**
- 성명 (필수)
- 연락처 (필수, 정규식 검증: ^01[0-9]-?\d{4}-?\d{4}$)
- 이메일 (선택)
- 주소 (필수, 다음 주소 API 연동)
- 상세주소 (선택)
- 건물 유형 (필수, 셀렉트: APT, OFFICETEL, OFFICE, STORE, FACTORY, ETC)
- 면적(평) (선택, 숫자 입력)

**Step 2: 청소 항목 구성 (핵심)**
- 프리셋 버튼: 주 1회 / 주 2회 / 주 3회 / 주 5회 / 매일
- 요일 체크박스: 월 화 수 목 금 토 일
- 항목 테이블 (동적 추가/삭제/정렬)
  - 구역, 내용, 요일, 수량, 단가, 금액(자동계산)
  - 제외구역, 비고 (선택)
- 할인 설정 (라디오 버튼 + 입력)
- 부가세 포함/별도 (토글)
- 실시간 총액 표시 (우측 하단 고정)

**Step 3: 산출 내역 확인**
- 품목별 내역 테이블
- 산출 요약 카드
  - 공급가액 합계
  - 할인금액
  - 과세금액
  - 부가세
  - 총 견적금액 (강조)
- 유효기간 설정 (기본 30일)

**Step 4: 디자인 선택 & 미리보기**
- 디자인 카드 3종 (클릭 선택)
- 실시간 미리보기 (서버에서 생성된 PNG)
- 워터마크 노트
- "견적서 생성" 버튼

### 7.3 완료 페이지

- 성공 메시지
- 견적번호 표시 (TEMP-xxx)
- 유효기간 카운트다운
- 주요 액션 버튼 그룹
  - PDF 다운로드
  - 링크 복사하기
- 유도 배너 (회원가입 유도 - Phase 2 연결)

---

## 8. 사용자 시나리오

### UC-01: 비회원 무료 견적서 생성

사전 조건:
- 사용자는 yulsoft.kr에 처음 방문
- 로그인하지 않은 상태

흐름:
1. 랜딩 페이지 진입 -> "무료 견적서 만들기" 클릭
2. Step 1: 고객 정보 입력 -> 다음
3. Step 2:
   - "주 2회" 프리셋 클릭 -> 월/목 자동 체크
   - 항목 2개 추가 (거실/화장실)
   - 수량/단가 입력 -> 실시간 금액 확인
   -> 다음
4. Step 3: 산출 내역 확인 -> 다음
5. Step 4: "modern" 디자인 선택 -> 미리보기 확인
   -> "견적서 생성" 클릭
6. 서버: DB 저장 -> PDF 생성 (워터마크 포함)
7. 완료 페이지: PDF 다운로드 + 링크 복사

완료 기준:
- 워터마크 포함 PDF 정상 다운로드
- 공유 링크로 웹뷰 확인 가능
- 30일 후 자동 만료

예외:
- 필수 입력 누락 -> 필드별 에러 메시지
- 서버 에러 -> 재시도 버튼 + 토스트

---

## 9. 배치 작업

### 만료 처리 (매일 자정)

```python
async def expire_quotes_job():
    # 30일 경과 견적 EXPIRED 처리
    expired = await db.execute("""
        UPDATE quote SET status = 'EXPIRED', updated_at = NOW()
        WHERE expires_at < NOW() AND status IN ('DRAFT', 'COMPLETED')
        RETURNING id
    """)
    
    # 30일 추가 경과 시 비회원 견적 삭제
    await db.execute("""
        DELETE FROM quote 
        WHERE status = 'EXPIRED' 
          AND updated_at < NOW() - INTERVAL '30 days'
          AND user_id IS NULL
    """)
```

---

## 10. 배포 체크리스트

- [ ] Docker Compose로 로컬 환경 구동 확인
- [ ] 모든 API 엔드포인트 Swagger 문서 확인 (/docs)
- [ ] 3종 디자인 PDF 출력 확인
- [ ] 워터마크 강제 삽입 확인
- [ ] Rate Limiting 동작 확인
- [ ] 만료 배치 잡 동작 확인
- [ ] 모바일 반응형 확인
- [ ] SEO 메타태그 설정 (랜딩 페이지)