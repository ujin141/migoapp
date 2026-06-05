-- ── 1. traffic_logs 테이블 생성 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.traffic_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT,                        -- 브라우저 로컬스토리지를 통한 고유 방문자 ID
  page_path TEXT NOT NULL,                -- 유입된 페이지 경로 (예: '/travel-dna')
  utm_source TEXT,                        -- 유입 출처 (예: instagram, twitter, naver)
  utm_medium TEXT,                        -- 마케팅 매체 (예: story, post, bio)
  utm_campaign TEXT,                      -- 캠페인 이름 (예: travel-saju-2026)
  referrer_url TEXT,                      -- 이전 참조 페이지 URL
  user_agent TEXT,                        -- 브라우저 User Agent
  created_at TIMESTAMPTZ DEFAULT now()    -- 방문 시간
);

-- RLS 활성화
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS 보안 정책 설정 ───────────────────────────────────────
-- 웹 브라우저의 익명 방문자(anon) 및 가입 유저(authenticated) 모두 인서트 가능하도록 정책 설정
CREATE POLICY "Allow anonymous and authenticated inserts for traffic_logs" 
ON public.traffic_logs 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 어드민 대시보드 조회를 위해 인증된 유저(authenticated)만 조회 가능
CREATE POLICY "Allow authenticated read for traffic_logs" 
ON public.traffic_logs 
FOR SELECT 
TO authenticated 
USING (true);
