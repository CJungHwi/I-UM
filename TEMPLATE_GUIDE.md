# 🚀 템플릿 프로젝트 가이드

이 문서는 현재 프로젝트를 템플릿으로 사용하여 새 프로젝트를 시작할 때 필요한 작업을 안내합니다.

---

## 📋 프로젝트 개요

- **프레임워크**: Next.js 16 (App Router)
- **스타일링**: TailwindCSS 4 + Shadcn UI
- **인증**: NextAuth v5 (Credentials Provider, bcrypt)
- **데이터베이스**: MySQL (Stored Procedure 기반)
- **폰트**: Inter (기본), Oswald (브랜드 헤더)

---

## ✅ 템플릿 사용 시 유지할 파일/폴더

### 핵심 설정 파일
```
├── package.json              # 의존성 관리
├── next.config.ts            # Next.js 설정
├── tsconfig.json             # TypeScript 설정
├── tailwind.config.ts        # TailwindCSS 설정 (있을 경우)
├── postcss.config.mjs        # PostCSS 설정
├── eslint.config.mjs         # ESLint 설정
├── components.json           # Shadcn UI 설정
```

### 소스 코드 (유지)
```
src/
├── app/
│   ├── layout.tsx            # ✅ 루트 레이아웃 (폰트, 프로바이더)
│   ├── globals.css           # ✅ 전역 스타일 (CSS 변수)
│   ├── error.tsx             # ✅ 에러 페이지
│   └── (auth)/login/         # ✅ 로그인 페이지
├── components/
│   ├── layout/               # ✅ 레이아웃 컴포넌트
│   │   ├── dashboard-layout.tsx
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   ├── mobile-sidebar.tsx
│   │   └── sidebar-context.tsx
│   ├── ui/                   # ✅ Shadcn UI 컴포넌트 (18개)
│   ├── mode-toggle.tsx       # ✅ 다크/라이트 모드 토글
│   ├── providers.tsx         # ✅ 프로바이더 래퍼
│   ├── user-auth-form.tsx    # ✅ 로그인 폼
│   ├── user-nav.tsx          # ✅ 사용자 네비게이션
│   ├── dashboard-nav.tsx     # ✅ 대시보드 네비게이션
│   ├── dashboard-nav-with-folders.tsx # ✅ 폴더 구조 네비게이션
│   └── error-boundary.tsx    # ✅ 에러 바운더리
├── lib/
│   ├── db.ts                 # ✅ DB 연결 풀 & 프로시저 호출
│   ├── password.ts           # ✅ bcrypt 비밀번호 해싱/검증
│   ├── menu.ts               # ✅ 메뉴 데이터 조회
│   ├── menu-utils.ts         # ✅ 메뉴 유틸리티
│   └── utils.ts              # ✅ 공통 유틸리티 (cn 함수)
├── types/
│   ├── index.ts              # ✅ 공통 타입
│   ├── menu.ts               # ✅ 메뉴 타입
│   └── next-auth.d.ts        # ✅ NextAuth 타입 확장
├── auth.ts                   # ✅ NextAuth 설정
├── auth.config.ts            # ✅ 인증 설정
└── middleware.ts             # ✅ 인증 미들웨어
```

### Prisma/DB 관련 (유지)
```
prisma/
├── migrations/
│   ├── create_menu_table.sql     # ✅ 메뉴 테이블 생성
│   ├── create_get_menu_procedure.sql # ✅ 메뉴 조회 프로시저
│   └── alter_menu_add_folder.sql # ✅ 폴더 컬럼 추가
└── procedures/
    └── get_user_by_id.sql        # ✅ 사용자 조회 프로시저
```

### Cursor 설정 (유지)
```
.cursor/
└── rules/
    └── ui-style-guide.mdc         # ✅ UI·스타일 통합 가이드
```

---

## ❌ 삭제해야 할 파일/폴더 (비즈니스 로직)

새 프로젝트 시작 시 아래 파일들을 삭제합니다:

### 페이지 및 컴포넌트
```
src/app/
├── (dashboard)/              # 🗑️ 일일 가격 수집 페이지
│   ├── page.tsx
│   ├── types.ts
│   └── components/
│       ├── daily-price-page-client.tsx
│       └── daily-price-toolbar.tsx
├── sku-reg/                  # 🗑️ SKU 등록 관리 페이지
│   ├── page.tsx
│   ├── types.ts
│   ├── loading.tsx
│   └── components/
│       ├── auto-sku-table.tsx
│       ├── sku-list-table.tsx
│       └── sku-reg-page-client.tsx
├── sku-search-url/           # 🗑️ SKU 검색 URL 관리 페이지
│   ├── page.tsx
│   ├── types.ts
│   └── components/
│       ├── sku-search-url-page-client.tsx
│       ├── sku-search-url-toolbar.tsx
│       └── url-review-table.tsx
└── api/sku-reg/              # 🗑️ SKU 관련 API 라우트
    └── (전체)
```

### 공통 컴포넌트 (비즈니스 로직)
```
src/components/
└── daily-price-table.tsx     # 🗑️ 일일 가격 테이블
```

### Server Actions
```
src/actions/
└── review-url.ts             # 🗑️ URL 승인/거부 액션
```

### DB 프로시저 (비즈니스 로직)
```
prisma/
├── migrations/
│   ├── create_get_daily_prices_procedure.sql    # 🗑️
│   ├── create_get_sku_search_urls_procedure.sql # 🗑️
│   └── Untitled                                  # 🗑️
└── procedures/
    ├── delete_auto_sku.sql           # 🗑️
    ├── get_auto_sku_products.sql     # 🗑️
    ├── get_sku_reg_products.sql      # 🗑️
    ├── insert_auto_sku.sql           # 🗑️
    ├── update_auto_sku_exec_yn.sql   # 🗑️
    └── update_sku_search_url_status.sql # 🗑️
```

### 기타
```
├── MENU_SETUP_GUIDE.md       # 🗑️ (필요시 유지)
├── REACT_CODE_REVIEW.md      # 🗑️
├── 프로젝트 구조 확인.md      # 🗑️
└── prisma/seed.js            # 🗑️ (새 시드 파일 작성)
```

---

## 🔧 새 프로젝트 시작 체크리스트

### 1. 프로젝트 복사 후 정리
```bash
# 삭제할 폴더/파일 제거
rm -rf src/app/(dashboard)/
rm -rf src/app/sku-reg/
rm -rf src/app/sku-search-url/
rm -rf src/app/api/sku-reg/
rm -f src/components/daily-price-table.tsx
rm -rf src/actions/
rm -f prisma/migrations/create_get_daily_prices_procedure.sql
rm -f prisma/migrations/create_get_sku_search_urls_procedure.sql
rm -f prisma/migrations/Untitled
rm -f prisma/procedures/delete_auto_sku.sql
rm -f prisma/procedures/get_auto_sku_products.sql
rm -f prisma/procedures/get_sku_reg_products.sql
rm -f prisma/procedures/insert_auto_sku.sql
rm -f prisma/procedures/update_auto_sku_exec_yn.sql
rm -f prisma/procedures/update_sku_search_url_status.sql
rm -f prisma/seed.js
rm -f REACT_CODE_REVIEW.md
rm -f MENU_SETUP_GUIDE.md
rm -f "프로젝트 구조 확인.md"
```

### 2. package.json 수정
```json
{
  "name": "새-프로젝트-이름",
  "version": "0.1.0",
  ...
}
```

### 3. 환경 변수 설정 (.env.local)
```env
# 데이터베이스
DATABASE_URL=mysql://user:password@localhost:3306/dbname

# NextAuth
AUTH_SECRET=your-auth-secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. 새 대시보드 페이지 생성
```typescript
// src/app/(dashboard)/page.tsx
export default function DashboardPage() {
  return (
    <div className="relative h-full p-0 flex flex-col gap-[3px] overflow-hidden bg-background">
      {/* 새 컨텐츠 */}
    </div>
  )
}
```

### 5. 메뉴 설정 (DB)
```sql
-- 메뉴 테이블에 새 메뉴 항목 추가
INSERT INTO menu (menu_id, title, href, icon, parent_id, sort_order, is_folder, is_active, required_level)
VALUES ('dashboard', '대시보드', '/', 'LayoutDashboard', NULL, 1, 'N', 'Y', 0);
```

---

## 📐 DataTable 스타일 규격

모든 데이터 테이블은 다음 규격을 따릅니다:

| 요소 | 규격 |
|------|------|
| 헤더 높이 | `h-[40px]` (40px) |
| 행 높이 | `h-[30px]` (30px) |
| 폰트 크기 | `text-[11px]` (11px) |
| 헤더 배경 (Light) | `bg-[#b9adb5]` |
| 헤더 배경 (Dark) | `bg-gray-800` |
| 행 배경 (Light) | `bg-[#f9fafb]` |
| 행 배경 (Dark) | `bg-[#1d1d1d]` |
| 테두리 (Light) | `border-[#343637]` |
| 테두리 (Dark) | `border-[#6b7280]` |
| 호버 텍스트 (Light) | `text-blue-600` |
| 호버 텍스트 (Dark) | `text-yellow-400` |

---

## 🔐 인증 시스템

### 비밀번호 해싱 (bcrypt)
```typescript
import { hashPassword, verifyPassword } from "@/lib/password"

// 새 비밀번호 해싱
const hashedPassword = await hashPassword("plainPassword")

// 비밀번호 검증
const isValid = await verifyPassword("plainPassword", hashedPassword)
```

### 세션 정보
```typescript
interface User {
  id: number
  mbId: string
  name: string | null
  email: string | null
  mbLevel: number  // 권한 레벨
}
```

---

## 📁 새 기능 추가 시 폴더 구조

```
src/app/새-기능/
├── page.tsx                 # 서버 컴포넌트 (데이터 페칭)
├── types.ts                 # 타입 정의
├── loading.tsx              # 로딩 UI (선택)
└── components/
    ├── 기능-page-client.tsx # 클라이언트 컴포넌트
    ├── 기능-toolbar.tsx     # 툴바 (선택)
    └── 기능-table.tsx       # 테이블 (선택)
```

---

## 🎨 테마 색상 (globals.css)

```css
:root {
  /* Light Mode */
  --background: #ffffff;
  --foreground: #1d1d1d;
  --card: #f9fafb;
  --border: #343637;
}

.dark {
  /* Dark Mode */
  --background: #020817;
  --foreground: #ffffff;
  --card: #292929;
  --border: #6b7280;
}
```

---

## 🚀 개발 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

이 가이드를 따라 새 프로젝트를 빠르게 시작할 수 있습니다!
