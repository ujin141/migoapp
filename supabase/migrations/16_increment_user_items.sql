-- ── increment_user_items RPC 함수 정의 ──────────────────────────────────────────
-- boosts와 super_likes 수량을 원자적으로 증가(또는 감소)시킵니다.
-- 동시 결제/충전/사용 시 생길 수 있는 Race Condition(SELECT + UPDATE)을 예방합니다.

CREATE OR REPLACE FUNCTION increment_user_items(
  p_user_id UUID,
  p_boosts INT,
  p_super_likes INT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_items (user_id, boosts, super_likes)
  VALUES (p_user_id, COALESCE(p_boosts, 0), COALESCE(p_super_likes, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET boosts = user_items.boosts + COALESCE(p_boosts, 0),
      super_likes = user_items.super_likes + COALESCE(p_super_likes, 0);
END;
$$ LANGUAGE plpgsql;
