# 🌏 Migo — Travel Matching App

> 여행자들을 연결하는 소셜 여행 플랫폼

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/migo-app)

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## ⚙️ 환경변수 설정

`.env.example` 파일을 `.env.local` 로 복사 후 실제 값을 입력하세요:

```bash
cp .env.example .env.local
```

| 변수 | 설명 | 발급처 |
|------|------|--------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL | [supabase.com](https://supabase.com) |
| `VITE_SUPABASE_ANON_KEY` | Supabase 익명 키 | supabase.com |
| `VITE_OPENAI_API_KEY` | 번역 기능용 OpenAI 키 | [platform.openai.com](https://platform.openai.com) |
| `VITE_GOOGLE_MAPS_API_KEY` | 지도 기능 (선택) | [console.cloud.google.com](https://console.cloud.google.com) |

## 🗄️ 데이터베이스 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **SQL Editor** 에서 `supabase/schema.sql` 전체 내용 실행
3. `.env.local` 에 URL과 Anon Key 입력

## 📦 배포 (Vercel)

### 방법 1 — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### 방법 2 — GitHub 자동 배포

1. GitHub에 push
2. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 연동
3. Vercel Dashboard > **Settings > Environment Variables** 에 `.env.local` 값 모두 추가
4. 이후 `main` 브랜치 push 시 자동 배포

### GitHub Secrets 설정 (CI/CD)

GitHub Repository > Settings > Secrets and variables > Actions:

| Secret | 설명 |
|--------|------|
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `VITE_OPENAI_API_KEY` | OpenAI API Key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps Key |
| `VERCEL_TOKEN` | Vercel 토큰 |
| `VERCEL_ORG_ID` | Vercel 조직 ID |
| `VERCEL_PROJECT_ID` | Vercel 프로젝트 ID |

## 🛠️ 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| UI | TailwindCSS + Radix UI + Framer Motion |
| 백엔드 (BaaS) | **Supabase** (PostgreSQL + Auth + Realtime + Storage) |
| 번역 | **OpenAI GPT-4o-mini** |
| 지도 | Google Maps |
| 배포 | **Vercel** |

## 📁 주요 파일 구조

```
src/
├── lib/
│   ├── supabaseClient.ts   # Supabase 클라이언트
│   └── translateService.ts # OpenAI 번역 서비스
├── hooks/
│   ├── useAuth.ts          # 인증 훅
│   └── useRealtimeChat.ts  # 실시간 채팅 훅
├── pages/                  # 각 페이지 컴포넌트
└── context/                # 전역 상태

supabase/
└── schema.sql              # DB 스키마 (Supabase에서 실행)
```

## 📝 라이선스

MIT
