-- ============================================================
-- 19_admin_notes_security.sql
-- 관리자 전용 메모 및 차단 사유 변조 방어
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION block_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- 서비스 롤(관리자)이 아닌 일반 유저의 직접 수정 요청인 경우
  IF auth.role() IN ('authenticated', 'anon') THEN
    
    -- 기존 차단 로직 (횟수 감소 차단 및 주요 상태 변경 차단)
    IF NEW.instant_meets_count < OLD.instant_meets_count THEN
      NEW.instant_meets_count := OLD.instant_meets_count;
    END IF;
    IF NEW.no_show_count < OLD.no_show_count THEN
      NEW.no_show_count := OLD.no_show_count;
    END IF;
    IF NEW.is_banned != OLD.is_banned THEN NEW.is_banned := OLD.is_banned; END IF;
    IF NEW.banned != OLD.banned THEN NEW.banned := OLD.banned; END IF;
    IF NEW.id_verified != OLD.id_verified THEN NEW.id_verified := OLD.id_verified; END IF;
    IF NEW.phone_verified != OLD.phone_verified THEN NEW.phone_verified := OLD.phone_verified; END IF;
    IF NEW.email_verified != OLD.email_verified THEN NEW.email_verified := OLD.email_verified; END IF;

    -- 관리자 전용 필드(메모, 차단 사유, 차단 기한 등) 임의 조작 방지
    IF NEW.admin_note != OLD.admin_note THEN NEW.admin_note := OLD.admin_note; END IF;
    IF NEW.ban_reason != OLD.ban_reason THEN NEW.ban_reason := OLD.ban_reason; END IF;
    IF NEW.banned_until != OLD.banned_until THEN NEW.banned_until := OLD.banned_until; END IF;

    -- 관리자 권한 상승 방어
    IF NEW.is_admin != OLD.is_admin THEN NEW.is_admin := OLD.is_admin; END IF;
    IF NEW.role != OLD.role THEN NEW.role := OLD.role; END IF;
    
    -- 결제 및 구독 관련 상태 조작 방어
    IF NEW.is_plus != OLD.is_plus THEN NEW.is_plus := OLD.is_plus; END IF;
    IF NEW.plan != OLD.plan THEN NEW.plan := OLD.plan; END IF;
    IF NEW.plus_expires_at != OLD.plus_expires_at THEN NEW.plus_expires_at := OLD.plus_expires_at; END IF;
    IF NEW.boost_expires_at != OLD.boost_expires_at THEN NEW.boost_expires_at := OLD.boost_expires_at; END IF;
    IF NEW.super_likes_left > OLD.super_likes_left THEN NEW.super_likes_left := OLD.super_likes_left; END IF;
    
    -- 신뢰도 점수 및 리뷰 횟수, 뱃지 등 조작 방어
    IF NEW.trust_score != OLD.trust_score THEN NEW.trust_score := OLD.trust_score; END IF;
    IF NEW.avg_rating != OLD.avg_rating THEN NEW.avg_rating := OLD.avg_rating; END IF;
    IF NEW.review_count != OLD.review_count THEN NEW.review_count := OLD.review_count; END IF;
    IF NEW.has_badge != OLD.has_badge THEN NEW.has_badge := OLD.has_badge; END IF;
    IF NEW.earned_badges != OLD.earned_badges THEN NEW.earned_badges := OLD.earned_badges; END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
