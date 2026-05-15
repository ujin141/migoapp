-- ============================================================
-- 13_privilege_escalation.sql
-- 심각한 권한 상승 취약점(Privilege Escalation) 방어
-- 사용자가 자신의 프로필을 수정할 때 is_admin, role 등을 조작할 수 없도록 차단합니다.
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

    -- [신규] 관리자 권한 상승 방어
    IF NEW.is_admin != OLD.is_admin THEN NEW.is_admin := OLD.is_admin; END IF;
    IF NEW.role != OLD.role THEN NEW.role := OLD.role; END IF;
    
    -- [신규] 결제 및 구독 관련 상태 조작 방어
    IF NEW.is_plus != OLD.is_plus THEN NEW.is_plus := OLD.is_plus; END IF;
    IF NEW.plan != OLD.plan THEN NEW.plan := OLD.plan; END IF;
    IF NEW.plus_expires_at != OLD.plus_expires_at THEN NEW.plus_expires_at := OLD.plus_expires_at; END IF;
    IF NEW.boost_expires_at != OLD.boost_expires_at THEN NEW.boost_expires_at := OLD.boost_expires_at; END IF;
    IF NEW.super_likes_left > OLD.super_likes_left THEN NEW.super_likes_left := OLD.super_likes_left; END IF;
    
    -- [신규] 신뢰도 점수 및 리뷰 횟수 조작 방어
    IF NEW.trust_score != OLD.trust_score THEN NEW.trust_score := OLD.trust_score; END IF;
    IF NEW.avg_rating != OLD.avg_rating THEN NEW.avg_rating := OLD.avg_rating; END IF;
    IF NEW.review_count != OLD.review_count THEN NEW.review_count := OLD.review_count; END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
