-- ============================================================
-- 16_admin_rls_fixes.sql
-- 심각한 권한 탈취 취약점(Privilege Escalation & Data Wipe) 방어
-- id_verifications 및 marketplace_items 의 잘못된 ALL 권한 정책 수정
-- ============================================================

BEGIN;

-- 1. id_verifications 정책 수정
-- (기존) 모든 로그인 유저가 다른 유저의 신분증 사진을 보거나 승인/거절 상태를 조작할 수 있는 치명적 결함 존재
DROP POLICY IF EXISTS "idv_admin" ON public.id_verifications;

CREATE POLICY "idv_admin" ON public.id_verifications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- 2. marketplace_items 정책 수정
-- (기존) 모든 로그인 유저가 마켓 상품의 가격을 바꾸거나, 남의 상품을 삭제할 수 있는 치명적 결함 존재
DROP POLICY IF EXISTS "marketplace_admin" ON public.marketplace_items;

CREATE POLICY "marketplace_admin" ON public.marketplace_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- 추가로, 마켓플레이스 아이템은 호스트(판매자) 본인도 관리(수정/삭제)할 수 있어야 합니다.
DROP POLICY IF EXISTS "marketplace_host_all" ON public.marketplace_items;
CREATE POLICY "marketplace_host_all" ON public.marketplace_items
  FOR ALL TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

COMMIT;
