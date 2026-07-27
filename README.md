# 율소프트 견적서 MVP (yulsoft-quote-nemo)

로그인 없이 바로 만드는 전문적인 청소 견적서 서비스

## 🚀 주요 기능

- **로그인 불필요**: 회원가입/로그인 없이 바로 견적서 작성
- **4단계 스텝퍼**: 고객정보 → 항목구성 → 산출확인 → 디자인선택
- **자동 계산**: 공급가액, 할인, 부가세, 합계금액 실시간 자동 산출
- **3가지 디자인**: 클래식 / 모던(애플 스타일) / 컬러
- **PDF 생성**: WeasyPrint 기반 고품질 PDF (워터마크 포함)
- **공유 링크**: 30일간 유효한 공개 URL로 고객에게 전달
- **모바일 최적화**: 현장에서 스마트폰으로 바로 작성 가능

## 🛠 기술 스택

### Backend
- **FastAPI** - 비동기 웹 프레임워크
- **PostgreSQL 16** - JSONB 지원, UUID PK
- **SQLAlchemy 2.0** - 비동기 ORM
- **Alembic** - 마이그레이션
- **WeasyPrint** - PDF 생성 (CSS Paged Media)
- **Pydantic v2** - 검증 & 직렬화

### Frontend
- **Next.js 14** (App Router) - SSR/SSG
- **React 18** - UI 라이브러리
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **TypeScript** - 타입 안전성

### Infra
- **Docker Compose** - 로컬 개발 환경
- **uvicorn** - ASGI 서버

## 📁 프로젝트 구조

```
yulsoft-quote-nemo/
├── backend/                 # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/         # API 라우터
│   │   ├── core/           # 설정, 로깅
│   │   ├── db/             # DB 세션
│   │   ├── models/         # SQLAlchemy 모델
│   │   ├── schemas/        # Pydantic 스키마
│   │   ├── services/       # 비즈니스 로직
│   │   └── templates/      # Jinja2 템플릿 (PDF용)
│   ├── alembic/            # 마이그레이션
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/                # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/            # App Router 페이지
│   │   ├── components/     # React 컴포넌트
│   │   ├── lib/            # 유틸리티
│   │   ├── store/          # Zustand 스토어
│   │   └── types/          # TypeScript 타입
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🏁 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)

### 1. 저장소 클론
```bash
git clone <repository-url>
cd yulsoft-quote-nemo
```

### 2. 환경 변수 설정
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

### 3. Docker Compose로 실행
```bash
docker-compose up -d --build
```

서비스 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 4. 로컬 개발 (Docker 없이)

#### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📋 API 명세

### 견적 미리보기 (저장 안 함)
```
POST /api/v1/quotes/preview
Content-Type: application/json

{
  "customer": {...},
  "supplier": {...},
  "calculation": {...},
  "design_key": "classic",
  "expires_days": 30
}
```

### 견적서 생성 및 저장
```
POST /api/v1/quotes
Content-Type: application/json

{...동일한 요청 바디...}

Response 201:
{
  "id": "uuid",
  "quote_number": "TEMP-a1b2c3d4",
  "public_url": "https://yulsoft.kr/q/{id}",
  "pdf_url": "https://yulsoft.kr/api/v1/quotes/{id}/pdf",
  "expires_at": "2026-08-21T06:14:00+09:00"
}
```

### 견적서 조회
```
GET /api/v1/quotes/{public_id}?format=json|html
```

### PDF 다운로드
```
GET /api/v1/quotes/{public_id}/pdf
Content-Type: application/pdf
```

## 🎨 디자인 시스템

### 클래식 (Classic)
- 전통적인 견적서 스타일
- 세리프 폰트, 명확한 구분선
- 전문적인 인상

### 모던 (Modern) - 기본값
- 애플 스타일 미니멀 디자인
- 산세리프 폰트, 넉넉한 여백
- 세련된 느낌

### 컬러 (Color)
- 브랜드 컬러 강조형
- 차별화된 인상

## 📝 개발 가이드

### 백엔드 코드 스타일
```bash
cd backend
ruff check .
ruff format .
mypy .
pytest
```

### 프론트엔드 코드 스타일
```bash
cd frontend
npm run lint
npm run type-check
npm test
```

### 마이그레이션 생성
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## 🚢 배포

### 프로덕션 환경 변수
```env
# Backend
DEBUG=false
SECRET_KEY=your-super-secret-key-min-32-chars
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
CORS_ORIGINS=["https://yulsoft.kr"]
LOG_LEVEL=INFO
LOG_FORMAT=json

# Frontend
NEXT_PUBLIC_API_URL=https://api.yulsoft.kr/api/v1
```

### Docker 프로덕션 빌드
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## 📄 라이선스

Proprietary - 율소프트 (Yulsoft)

## 📞 문의

- 웹사이트: https://yulsoft.kr
- 이메일: contact@yulsoft.kr