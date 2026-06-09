-- 19_daily_checkin_reward_fix.sql
-- Fix daily check-in rewards so app-visible inventory is updated.
-- The app reads Super Likes and boosts from user_items, so rewards must upsert
-- into that table instead of relying only on legacy profiles columns.

DROP FUNCTION IF EXISTS public.do_daily_checkin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.do_daily_checkin(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_last_checkin timestamptz;
  v_streak integer;
  v_today date := CURRENT_DATE;
  v_reward text;
BEGIN
  SELECT last_checkin_at, COALESCE(checkin_streak, 0)
  INTO v_last_checkin, v_streak
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_last_checkin IS NOT NULL AND DATE(v_last_checkin AT TIME ZONE 'UTC') = v_today THEN
    RETURN jsonb_build_object(
      'already', true,
      'streak', COALESCE(v_streak, 1),
      'reward', 'badge_only'
    );
  END IF;

  IF v_last_checkin IS NOT NULL AND DATE(v_last_checkin AT TIME ZONE 'UTC') = v_today - INTERVAL '1 day' THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSE
    v_streak := 1;
  END IF;

  IF v_streak > 7 THEN
    v_streak := 1;
  END IF;

  IF v_streak = 7 THEN
    v_reward := 'crown_badge';
  ELSIF v_streak = 3 OR v_streak = 5 THEN
    v_reward := 'boost_30m';
  ELSE
    v_reward := 'super_like_1';
  END IF;

  UPDATE public.profiles
  SET last_checkin_at = NOW(),
      checkin_streak = v_streak,
      last_active_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.daily_checkins(user_id, checked_at, streak, reward)
  VALUES (p_user_id, v_today, v_streak, v_reward)
  ON CONFLICT (user_id, checked_at) DO UPDATE
  SET streak = EXCLUDED.streak,
      reward = EXCLUDED.reward;

  IF v_reward = 'super_like_1' THEN
    INSERT INTO public.user_items(user_id, super_likes)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET super_likes = COALESCE(public.user_items.super_likes, 0) + 1;
  ELSIF v_reward = 'crown_badge' THEN
    INSERT INTO public.user_items(user_id, super_likes)
    VALUES (p_user_id, 3)
    ON CONFLICT (user_id) DO UPDATE
    SET super_likes = COALESCE(public.user_items.super_likes, 0) + 3;

    UPDATE public.profiles
    SET has_badge = true
    WHERE id = p_user_id;
  ELSIF v_reward = 'boost_30m' THEN
    INSERT INTO public.user_items(user_id, boosts)
    VALUES (p_user_id, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET boosts = COALESCE(public.user_items.boosts, 0) + 1;

    UPDATE public.profiles
    SET boost_expires_at = GREATEST(COALESCE(boost_expires_at, NOW()), NOW()) + INTERVAL '30 minutes'
    WHERE id = p_user_id;
  END IF;

  INSERT INTO public.notifications(user_id, type, target_text, is_read)
  VALUES (
    p_user_id,
    'system',
    CASE v_reward
      WHEN 'super_like_1' THEN '출석 보상: 슈퍼라이크 1개 지급!'
      WHEN 'boost_30m' THEN '출석 보상: 프로필 부스트 30분!'
      WHEN 'crown_badge' THEN '7일 연속 출석 달성! 슈퍼라이크 3개 + 왕관 배지!'
      ELSE '오늘 출석 완료!'
    END,
    false
  );

  RETURN jsonb_build_object('already', false, 'streak', v_streak, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.do_daily_checkin(uuid) TO authenticated;

-- Enable Realtime replication for user_items and profiles tables
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE user_items;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
