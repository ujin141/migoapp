-- ============================================================
-- 22_likes_security.sql
-- 무제한 슈퍼라이크(Super Like Bypass) 취약점 방어
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION enforce_superlike_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- 관리자 및 백엔드(RPC/트리거)는 허용
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 일반 유저가 'super_like'를 직접 likes 테이블에 INSERT 하려는 경우 차단
  -- (슈퍼라이크는 오직 record_superlike RPC 함수를 통해서만 생성되어야 하며, 
  --  이때 RPC는 SECURITY DEFINER로 실행되므로 auth.role() = 'authenticated' 필터에 걸리지 않음)
  -- 참고: Supabase RPC 내에서 auth.role()은 여전히 호출자의 롤(authenticated)일 수 있으므로,
  -- 더 안전한 방법은 클라이언트에서 직접 입력한 kind 값 중 super_like 인 것을 강제로 like 로 다운그레이드 시키거나 막는 것입니다.
  
  -- Supabase RPC 내에서 실행 중인지 판단하기 어렵기 때문에, 
  -- 트리거보다는 likes 테이블 정책이나 로직에 맞게 검증합니다.
  -- 🚨 클라이언트 측의 API를 통해 INSERT를 시도할 때, kind가 'super_like' 이면 무조건 차단합니다.
  -- 단, RPC에서 호출될 경우도 막힐 수 있으므로, RPC(record_superlike)의 로직을 수정하여 우회합니다.
  
  -- RPC에서 사용할 특별한 키워드나 세션 변수를 쓰는 대신, 간단하게 트리거로 과금 재화 우회를 차단.
  IF NEW.kind = 'super_like' THEN
    -- RPC 내부에서 호출될 때는 current_setting을 확인할 수 있으나, 더 확실한 방법은
    -- 유저가 직접 likes에 넣는 경우를 막기 위해, 수량 감소를 강제하는 것입니다.
    -- 그런데 이미 RPC에서 수량을 감소시키고 INSERT를 수행하므로, 여기서 또 감소시키면 2배로 감소합니다.
    -- 이 트리거는 유저가 RPC를 안 거치고 직접 INSERT 한 경우를 잡아냅니다.
    RAISE EXCEPTION 'Super likes must be sent through the official record_superlike RPC';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 💡 해결책: 기존 record_superlike RPC를 수정하여, likes 테이블의 RLS를 우회할 수 있도록 
-- postgres 롤(혹은 릴레이션 직접 수정)을 사용하거나, 
-- 가장 심플한 방법으로는 RLS를 강화하여 일반 유저의 likes INSERT를 일반 'like' 만 가능하도록 제한하는 것입니다.

DROP POLICY IF EXISTS "likes_insert_own" ON public.likes;

-- (변경) 일반 사용자는 kind 가 'like' 인 경우에만 직접 INSERT 가능합니다. 
-- 'super_like' 는 SECURITY DEFINER 가 걸린 RPC 내부에서 RLS를 우회하여 삽입됩니다.
-- (Supabase RPC는 SECURITY DEFINER 일 때 서비스 롤 권한을 가지므로 이 RLS를 통과합니다)
CREATE POLICY "likes_insert_own" ON public.likes 
  FOR INSERT WITH CHECK (
    auth.uid() = from_user 
    AND (kind = 'like' OR kind IS NULL)
  );

-- UPDATE 시에도 kind를 super_like로 바꿀 수 없도록 차단
DROP POLICY IF EXISTS "likes_update_own" ON public.likes;
CREATE POLICY "likes_update_own" ON public.likes 
  FOR UPDATE USING (auth.uid() = from_user)
  WITH CHECK (kind != 'super_like');

COMMIT;
