-- ============================================================
-- 17_items_rls_fixes.sql
-- 심각한 유료 아이템 무한 증식(Data Forging) 방어
-- user_items 테이블 및 구매 내역 위조 방지
-- ============================================================

BEGIN;

-- 1. user_items (슈퍼라이크, 부스트 등)
-- (기존) FOR ALL 정책으로 인해 유저가 자신의 슈퍼라이크와 부스트 개수를 무제한으로 늘릴 수 있었습니다.
DROP POLICY IF EXISTS "ui_own" ON public.user_items;

-- 조회는 본인만 가능
CREATE POLICY "ui_select" ON public.user_items 
  FOR SELECT USING (auth.uid() = user_id);

-- 유저가 직접 수량을 늘리는 업데이트를 차단 (트리거를 통해 강제 방어)
CREATE OR REPLACE FUNCTION block_item_forging()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.super_likes > OLD.super_likes THEN
      NEW.super_likes := OLD.super_likes;
    END IF;
    IF NEW.boosts > OLD.boosts THEN
      NEW.boosts := OLD.boosts;
    END IF;
    IF NEW.nearby_days > OLD.nearby_days THEN
      NEW.nearby_days := OLD.nearby_days;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_block_item_forging ON public.user_items;
CREATE TRIGGER trigger_block_item_forging
  BEFORE UPDATE ON public.user_items
  FOR EACH ROW EXECUTE FUNCTION block_item_forging();

-- 업데이트 정책 (수량 증가 시도는 위의 트리거가 막음, 차감은 허용)
CREATE POLICY "ui_update" ON public.user_items 
  FOR UPDATE USING (auth.uid() = user_id);

-- 유저가 스스로 아이템 로우를 지우거나 임의로 재생성하는 것 방지
-- INSERT와 DELETE 권한은 관리자 및 백엔드 트리거(on_profile_created_items)만 가지도록 제한


-- 2. purchases & subscriptions 내역 위조 방지
-- (기존) 유저가 스스로 구매 내역이나 구독 기록을 생성하여 유료 회원을 가장할 수 있었습니다.
DROP POLICY IF EXISTS "purchase_own" ON public.purchases;
CREATE POLICY "purchase_own_select" ON public.purchases 
  FOR SELECT USING (auth.uid() = user_id);
-- 인서트는 오직 서버 사이드(결제 웹훅/RPC)에서만 허용

DROP POLICY IF EXISTS "sub_own" ON public.subscriptions;
CREATE POLICY "sub_own_select" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
-- 인서트는 오직 서버 사이드(결제 웹훅/RPC)에서만 허용

COMMIT;
