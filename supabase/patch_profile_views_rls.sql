-- ============================================================
-- PATCH: profile_views RLS + profiles 컬럼 보완
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. profile_views INSERT 정책 수정
--    기존: auth.uid() = viewer_id (FOMO fake insert 차단됨)
--    변경: 인증된 모든 유저가 삽입 가능 (FOMO + 실제 조회 모두 허용)
DROP POLICY IF EXISTS "pv_insert" ON profile_views;
CREATE POLICY "pv_insert" ON profile_views
  FOR INSERT WITH CHECK (true);

-- 2. profile_views에 created_at 컬럼 보장
--    (일부 환경에서 viewed_at만 있고 created_at이 없을 수 있음)
ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. profiles 테이블 선택적 컬럼 보장
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS travel_mission    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visited_countries  TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_theme      TEXT DEFAULT 'default';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_urls         TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS travel_dates       TEXT;

-- 완료 메시지
DO $$ BEGIN
  RAISE NOTICE 'Patch applied: profile_views RLS and profiles columns are now fixed.';
END $$;
