-- 1. 데이터베이스 자체의 쿼리 시간 제한(Timeout)을 무제한으로 설정
SET statement_timeout = 0;

-- 2. 기존에 타임아웃으로 인해 실패(Invalid) 상태로 남아있을 수 있는 찌꺼기 인덱스들 모두 제거
DROP INDEX IF EXISTS idx_matches_user1;
DROP INDEX IF EXISTS idx_matches_user2;
DROP INDEX IF EXISTS idx_likes_from_created;
DROP INDEX IF EXISTS idx_meet_reviews_reviewed;

-- 3. 인덱스 한 번에 통합 생성 (약간의 테이블 잠김 발생)
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_likes_from_created ON likes(from_user, created_at DESC);
CREATE INDEX idx_meet_reviews_reviewed ON meet_reviews(reviewed_id);
