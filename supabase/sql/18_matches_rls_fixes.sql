-- ============================================================
-- 18_matches_rls_fixes.sql
-- 가짜 매칭 정보 생성(Fake Match Creation) 방어
-- ============================================================

BEGIN;

-- 1. matches 테이블의 취약한 INSERT 정책 수정
-- (기존) WITH CHECK (true) 로 설정되어 누구나 거짓 매칭 데이터를 생성하여 상대방의 매칭 목록에 자신을 표시할 수 있었습니다.
DROP POLICY IF EXISTS "matches_insert" ON public.matches;

-- (변경) 오직 본인이 당사자인 매칭만 생성할 수 있으며, 실제로는 14번 트리거 및 클라이언트 흐름상 상호 좋아요나 바로모임 검증을 통과해야 유효합니다.
CREATE POLICY "matches_insert" ON public.matches 
  FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- 2. matches UPDATE/DELETE 조작 방어
-- 일반 사용자는 matches 데이터를 임의로 지우거나 수정해서는 안 됩니다. (연결 끊기는 전용 API/비즈니스 로직을 통해 처리해야 함)
-- 따라서 권한을 SELECT와 INSERT로만 제한합니다. (기존에도 UPDATE/DELETE는 허용되지 않았으나 명시적으로 확인)
DROP POLICY IF EXISTS "matches_update" ON public.matches;
DROP POLICY IF EXISTS "matches_delete" ON public.matches;

COMMIT;
