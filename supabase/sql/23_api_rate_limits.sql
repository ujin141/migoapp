-- ============================================================
-- 23_api_rate_limits.sql
-- API 어뷰징(SMS Bombing 및 AI 번역 비용 폭탄) 방어용 컬럼 추가
-- ============================================================

BEGIN;

-- 1. profiles 테이블에 API 어뷰징 방지를 위한 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS otp_last_sent TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS translate_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS translate_last_reset DATE DEFAULT CURRENT_DATE;

-- 2. 컬럼들이 클라이언트에서 임의로 수정되지 않도록 19번 방어 트리거 업데이트
CREATE OR REPLACE FUNCTION block_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon') THEN
    
    -- 기존 차단 로직
    IF NEW.instant_meets_count < OLD.instant_meets_count THEN NEW.instant_meets_count := OLD.instant_meets_count; END IF;
    IF NEW.no_show_count < OLD.no_show_count THEN NEW.no_show_count := OLD.no_show_count; END IF;
    IF NEW.is_banned != OLD.is_banned THEN NEW.is_banned := OLD.is_banned; END IF;
    IF NEW.banned != OLD.banned THEN NEW.banned := OLD.banned; END IF;
    IF NEW.id_verified != OLD.id_verified THEN NEW.id_verified := OLD.id_verified; END IF;
    IF NEW.phone_verified != OLD.phone_verified THEN NEW.phone_verified := OLD.phone_verified; END IF;
    IF NEW.email_verified != OLD.email_verified THEN NEW.email_verified := OLD.email_verified; END IF;
    IF NEW.admin_note != OLD.admin_note THEN NEW.admin_note := OLD.admin_note; END IF;
    IF NEW.ban_reason != OLD.ban_reason THEN NEW.ban_reason := OLD.ban_reason; END IF;
    IF NEW.banned_until != OLD.banned_until THEN NEW.banned_until := OLD.banned_until; END IF;
    IF NEW.is_admin != OLD.is_admin THEN NEW.is_admin := OLD.is_admin; END IF;
    IF NEW.role != OLD.role THEN NEW.role := OLD.role; END IF;
    IF NEW.is_plus != OLD.is_plus THEN NEW.is_plus := OLD.is_plus; END IF;
    IF NEW.plan != OLD.plan THEN NEW.plan := OLD.plan; END IF;
    IF NEW.plus_expires_at != OLD.plus_expires_at THEN NEW.plus_expires_at := OLD.plus_expires_at; END IF;
    IF NEW.boost_expires_at != OLD.boost_expires_at THEN NEW.boost_expires_at := OLD.boost_expires_at; END IF;
    IF NEW.super_likes_left > OLD.super_likes_left THEN NEW.super_likes_left := OLD.super_likes_left; END IF;
    IF NEW.trust_score != OLD.trust_score THEN NEW.trust_score := OLD.trust_score; END IF;
    IF NEW.avg_rating != OLD.avg_rating THEN NEW.avg_rating := OLD.avg_rating; END IF;
    IF NEW.review_count != OLD.review_count THEN NEW.review_count := OLD.review_count; END IF;
    IF NEW.has_badge != OLD.has_badge THEN NEW.has_badge := OLD.has_badge; END IF;
    IF NEW.earned_badges != OLD.earned_badges THEN NEW.earned_badges := OLD.earned_badges; END IF;

    -- [신규] API 레이트 리밋 컬럼 변조 방지
    IF NEW.otp_last_sent != OLD.otp_last_sent THEN NEW.otp_last_sent := OLD.otp_last_sent; END IF;
    IF NEW.translate_count < OLD.translate_count AND NEW.translate_last_reset = OLD.translate_last_reset THEN 
      NEW.translate_count := OLD.translate_count; 
    END IF;
    IF NEW.translate_last_reset != OLD.translate_last_reset THEN NEW.translate_last_reset := OLD.translate_last_reset; END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
