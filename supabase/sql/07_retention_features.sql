-- ============================================================
-- MIGO 리텐션 Phase 1-1: 신규 가입 시 자동 좋아요 생성
-- 새 유저가 가입하면 모의 유저 10~15명이 자동으로 좋아요를 보냄
-- → 가입 직후 "15명이 회원님을 좋아합니다!" 알림 → 즉시 관심 유발
-- ============================================================

-- 출석체크 테이블 (Phase 1-2에서 사용)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checked_at DATE DEFAULT CURRENT_DATE,
  streak     INTEGER DEFAULT 1,
  reward     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checked_at)
);
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_select_own" ON daily_checkins;
DROP POLICY IF EXISTS "checkin_insert_own" ON daily_checkins;
CREATE POLICY "checkin_select_own" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkin_insert_own" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id, checked_at DESC);

-- ============================================================
-- FUNCTION: 신규 가입자에게 자동 좋아요 생성
-- profiles INSERT 후 실행 (handle_new_user 이후 자동 트리거)
-- ============================================================
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- FUNCTION: 출석체크 처리 (프론트에서 RPC 호출)
-- 연속 접속 일수(streak) 계산 + 보상 결정
-- ============================================================
CREATE OR REPLACE FUNCTION do_daily_checkin(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - 1;
  v_prev_streak INTEGER := 0;
  v_new_streak INTEGER := 1;
  v_reward TEXT := NULL;
  v_already BOOLEAN := false;
BEGIN
  -- 오늘 이미 체크인했는지 확인
  IF EXISTS(SELECT 1 FROM daily_checkins WHERE user_id = p_user_id AND checked_at = CURRENT_DATE) THEN
    v_already := true;
    SELECT streak, reward INTO v_new_streak, v_reward
    FROM daily_checkins WHERE user_id = p_user_id AND checked_at = CURRENT_DATE;
    RETURN jsonb_build_object('already', true, 'streak', v_new_streak, 'reward', v_reward);
  END IF;

  -- 어제 체크인했으면 연속 일수 이어가기
  SELECT streak INTO v_prev_streak
  FROM daily_checkins WHERE user_id = p_user_id AND checked_at = v_yesterday;

  IF v_prev_streak IS NOT NULL THEN
    v_new_streak := v_prev_streak + 1;
  ELSE
    v_new_streak := 1; -- 연속 끊김 → 리셋
  END IF;

  -- 보상 결정 (대부분 뱃지만, 특정 일차에만 소소한 보상)
  CASE v_new_streak
    WHEN 1 THEN v_reward := 'badge_only';       -- 출석 도장만
    WHEN 2 THEN v_reward := 'badge_only';       -- 출석 도장만
    WHEN 3 THEN v_reward := 'super_like_1';     -- 슈퍼라이크 1개
    WHEN 4 THEN v_reward := 'badge_only';
    WHEN 5 THEN v_reward := 'boost_30m';        -- 부스트 30분
    WHEN 6 THEN v_reward := 'badge_only';
    WHEN 7 THEN v_reward := 'super_like_1';     -- 슈퍼라이크 1개
    ELSE
      IF v_new_streak % 7 = 0 THEN v_reward := 'super_like_1';
      ELSE v_reward := 'badge_only';
      END IF;
  END CASE;

  -- 체크인 기록
  INSERT INTO daily_checkins(user_id, checked_at, streak, reward)
  VALUES(p_user_id, CURRENT_DATE, v_new_streak, v_reward)
  ON CONFLICT(user_id, checked_at) DO NOTHING;

  -- 보상 적용 (badge_only는 아무것도 지급하지 않음)
  IF v_reward = 'super_like_1' THEN
    UPDATE profiles SET super_likes_left = COALESCE(super_likes_left, 0) + 1 WHERE id = p_user_id;
  ELSIF v_reward = 'boost_30m' THEN
    UPDATE profiles SET boost_expires_at = NOW() + INTERVAL '30 minutes' WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('already', false, 'streak', v_new_streak, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
