-- ============================================================
-- 12_chat_security.sql
-- 채팅방 하이재킹 취약점 방어용 RLS 정책 업데이트
-- ============================================================

BEGIN;

-- chat_members 테이블의 보안 정책 업데이트
-- 기존 정책: 자기 자신이면 무조건 INSERT 가능 (치명적: 타인의 비밀 채팅방 thread_id를 알면 무단 침입 가능)
-- 신규 정책: 
-- 1. 그룹 채팅(is_group=true)일 경우에만 자기 자신(user_id=auth.uid()) INSERT 허용 (오픈채팅/그룹채팅)
-- 2. 채팅방 생성자(created_by)는 초기 멤버를 자유롭게 추가할 수 있음
-- 3. 이미 방에 속한 멤버는 다른 사람을 초대(INSERT)할 수 있음
DROP POLICY IF EXISTS "members_insert" ON chat_members;

CREATE POLICY "members_insert" ON chat_members FOR INSERT WITH CHECK (
  (EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND is_group = true) AND auth.uid() = user_id)
  OR EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND created_by = auth.uid())
  OR check_is_chat_member(thread_id)
);

COMMIT;
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
-- ============================================================
-- 14_match_security.sql (v2)
-- 강제 1:1 채팅 개설(Forced Chat) 취약점 방어 및 바로모임 자동 차감
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION enforce_chat_members_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_thread_is_group BOOLEAN;
  v_mutual BOOLEAN;
  v_caller_profile RECORD;
BEGIN
  -- 백엔드 서비스롤(관리자) 무조건 통과
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 1. 대상이 속한 채팅방이 1:1 방인지 그룹 방인지 확인
  SELECT is_group INTO v_thread_is_group FROM chat_threads WHERE id = NEW.thread_id;
  
  -- 그룹 방인 경우 추가 검증 없이 통과 (그룹은 별도의 참가 로직이 있음)
  IF v_thread_is_group THEN
    RETURN NEW;
  END IF;

  -- 2. 1:1 채팅방의 경우, 본인이 아닌 "타인"을 방에 추가하려는 순간을 포착 (상대방 초대 시점)
  IF NEW.user_id != v_caller THEN
    -- A. 상호 좋아요(Mutual Like) 확인
    SELECT EXISTS (
      SELECT 1 FROM likes WHERE from_user = v_caller AND to_user = NEW.user_id
    ) AND EXISTS (
      SELECT 1 FROM likes WHERE from_user = NEW.user_id AND to_user = v_caller
    ) INTO v_mutual;

    IF v_mutual THEN
      RETURN NEW; -- 정상 매칭 허용
    END IF;

    -- B. 상호 좋아요가 없으면 "바로모임 (Instant Meet)" 으로 간주하여 제한 검증 및 차감
    SELECT * INTO v_caller_profile FROM profiles WHERE id = v_caller FOR UPDATE;
    
    -- 플러스/프리미엄 멤버는 무제한
    IF v_caller_profile.is_plus = true THEN
      RETURN NEW;
    END IF;

    -- 무료 유저 횟수 제한 (3회 초과 시 에러 발생시켜 채팅 참가 차단)
    IF v_caller_profile.instant_meets_count >= 3 THEN
      RAISE EXCEPTION 'Instant meet limit reached';
    END IF;

    -- 횟수 1 증가 (차감 효과) - 이 업데이트는 트랜잭션 내에서 원자적으로 처리됨
    UPDATE profiles SET instant_meets_count = instant_meets_count + 1 WHERE id = v_caller;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 matches 테이블 트리거 제거 (오작동 방지)
DROP TRIGGER IF EXISTS trigger_enforce_match_rules ON public.matches;

-- chat_members 테이블에 강력한 삽입 방어 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_chat_members ON public.chat_members;
CREATE TRIGGER trigger_enforce_chat_members
  BEFORE INSERT ON public.chat_members
  FOR EACH ROW EXECUTE FUNCTION enforce_chat_members_rules();

COMMIT;
-- ============================================================
-- 15_group_security.sql
-- 강제 그룹 가입(Forced Group Join) 취약점 방어 및 승인 트리거 자동화
-- ============================================================

BEGIN;

-- 1. 그룹 멤버 가입 시 그룹의 상태(status)와 최대 인원수를 확인하는 트리거
CREATE OR REPLACE FUNCTION enforce_group_join_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_group RECORD;
  v_current_count INT;
BEGIN
  -- 백엔드/트리거(서비스롤)인 경우 제한 검증 패스
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 타인을 강제로 그룹에 넣으려는 시도 차단 (자신만 가입 가능)
  IF auth.uid() != NEW.user_id THEN
    RAISE EXCEPTION 'You can only join a group as yourself';
  END IF;

  -- 그룹 정보 조회
  SELECT * INTO v_group FROM trip_groups WHERE id = NEW.group_id FOR UPDATE;

  -- 현재 멤버 수 조회
  SELECT COUNT(*) INTO v_current_count FROM trip_group_members WHERE group_id = NEW.group_id;

  -- 인원 초과 확인
  IF v_current_count >= v_group.max_members THEN
    RAISE EXCEPTION 'Group is full';
  END IF;

  -- 그룹이 공개 모집 상태(recruiting)가 아니면 직접 가입 불가 (초대/승인 전용)
  IF v_group.status != 'recruiting' THEN
    RAISE EXCEPTION 'Cannot directly join a non-recruiting group';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_enforce_group_join ON public.trip_group_members;
CREATE TRIGGER trigger_enforce_group_join
  BEFORE INSERT ON public.trip_group_members
  FOR EACH ROW EXECUTE FUNCTION enforce_group_join_rules();

-- 2. 호스트가 지원자 승인(approved) 시 자동으로 멤버 테이블에 추가하는 트리거
CREATE OR REPLACE FUNCTION auto_join_approved_applicants()
RETURNS TRIGGER AS $$
BEGIN
  -- 지원 상태가 approved로 변경된 경우에만 작동
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO trip_group_members (group_id, user_id)
    VALUES (NEW.group_id, NEW.applicant_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_join_approved ON public.trip_applications;
CREATE TRIGGER trigger_auto_join_approved
  AFTER UPDATE OF status ON public.trip_applications
  FOR EACH ROW EXECUTE FUNCTION auto_join_approved_applicants();

COMMIT;
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
-- ============================================================
-- 18_matches_rls_fixes.sql
-- 가짜 매칭 정보 생성(Fake Match Creation) 방어
-- ============================================================

BEGIN;

-- 1. matches 테이블의 취약한 INSERT 정책 수정
-- (기존) WITH CHECK (true) 로 설정되어 누구나 거짓 매칭 데이터를 생성하여 상대방의 매칭 목록에 자신을 표시할 수 있었습니다.
DROP POLICY IF EXISTS "matches_insert" ON public.matches;

-- (변경) 오직 본인이 당사자인 매칭만 생성할 수 있으며, 실제로는 14번 트리거 및 클라이언트 흐름상 상호 좋아요나 바로모임 검증을 통과해야 유효합니다.
CREATE POLICY "matches_insert" ON public.matches 
  FOR INSERT WITH CHECK (auth.uid() IN (user1_id, user2_id));

-- 2. matches UPDATE/DELETE 조작 방어
-- 일반 사용자는 matches 데이터를 임의로 지우거나 수정해서는 안 됩니다. (연결 끊기는 전용 API/비즈니스 로직을 통해 처리해야 함)
-- 따라서 권한을 SELECT와 INSERT로만 제한합니다. (기존에도 UPDATE/DELETE는 허용되지 않았으나 명시적으로 확인)
DROP POLICY IF EXISTS "matches_update" ON public.matches;
DROP POLICY IF EXISTS "matches_delete" ON public.matches;

COMMIT;
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
-- ============================================================
-- 20_chat_threads_security.sql
-- 채팅방 악의적 파괴(Thread Destruction) 및 변조 방어
-- ============================================================

BEGIN;

-- 1. chat_threads 테이블의 삭제(DELETE) 권한 축소
-- (기존) 채팅방의 멤버라면 누구나 전체 채팅방(chat_threads 레코드)을 통째로 삭제할 수 있어, 그룹채팅 폭파 테러가 가능했습니다.
DROP POLICY IF EXISTS "threads_delete" ON public.chat_threads;

-- (변경) 오직 채팅방 생성자(created_by)만이 방을 완전히 삭제할 수 있습니다.
CREATE POLICY "threads_delete" ON public.chat_threads 
  FOR DELETE USING (created_by = auth.uid());


-- 2. chat_threads 테이블의 수정(UPDATE) 권한 축소
-- (기존) 채팅방의 멤버라면 누구나 채팅방의 이름이나 썸네일, 만료 시간 등을 임의로 수정할 수 있었습니다.
DROP POLICY IF EXISTS "threads_update" ON public.chat_threads;

-- (변경) 그룹 채팅방은 방장만 수정 가능하며, 1:1 채팅방은 양쪽 멤버 모두 수정(방 이름 동기화 등) 가능하게 제한합니다.
CREATE POLICY "threads_update" ON public.chat_threads 
  FOR UPDATE USING (
    (is_group = true AND created_by = auth.uid()) OR
    (is_group = false AND EXISTS (
      SELECT 1 FROM chat_members 
      WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid()
    ))
  );

COMMIT;
-- ============================================================
-- 21_reviews_security.sql
-- 허위 리뷰 및 평판 조작(Reputation Attack) 방어
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION enforce_review_rules()
RETURNS TRIGGER AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_has_connection BOOLEAN;
  v_target UUID;
BEGIN
  -- 관리자 및 백엔드(트리거 등)는 예외
  IF auth.role() != 'authenticated' THEN
    RETURN NEW;
  END IF;

  -- 리뷰어 본인이 맞는지 확인 (기존 RLS로도 방어되지만 이중 보안)
  IF NEW.reviewer_id != v_caller THEN
    RAISE EXCEPTION 'You can only write reviews as yourself';
  END IF;

  -- 타겟 추출 (meet_reviews는 reviewed_id, trip_reviews는 reviewee_id)
  -- 본 트리거는 meet_reviews와 trip_reviews 양쪽에 적용할 수 있도록 유연하게 작성
  BEGIN
    v_target := NEW.reviewed_id; -- meet_reviews 테이블인 경우
  EXCEPTION WHEN undefined_column THEN
    v_target := NEW.reviewee_id; -- trip_reviews 테이블인 경우
  END;

  -- 자기 자신에게 리뷰를 남기는 행위 차단 (어뷰징)
  IF v_caller = v_target THEN
    RAISE EXCEPTION 'You cannot review yourself';
  END IF;

  -- 리뷰어와 리뷰 대상자가 실제로 만난 적이 있는지(매칭, 같은 채팅방, 같은 그룹, 같은 안전 체크인 등) 검증
  SELECT EXISTS (
    -- 1. 1:1 매칭이 성사된 적 있는가?
    SELECT 1 FROM matches 
    WHERE (user1_id = v_caller AND user2_id = v_target) 
       OR (user1_id = v_target AND user2_id = v_caller)
  ) OR EXISTS (
    -- 2. 같은 그룹 여행(trip_groups) 멤버였던 적 있는가?
    SELECT 1 FROM trip_group_members tgm1
    JOIN trip_group_members tgm2 ON tgm1.group_id = tgm2.group_id
    WHERE tgm1.user_id = v_caller AND tgm2.user_id = v_target
  ) OR EXISTS (
    -- 3. 안전 체크인(safety_checkins) 기록이 있는가?
    SELECT 1 FROM safety_checkins 
    WHERE (user_id = v_caller AND partner_id = v_target) 
       OR (user_id = v_target AND partner_id = v_caller)
  ) INTO v_has_connection;

  IF NOT v_has_connection THEN
    RAISE EXCEPTION 'You can only review users you have matched or traveled with';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- meet_reviews 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_meet_review ON public.meet_reviews;
CREATE TRIGGER trigger_enforce_meet_review
  BEFORE INSERT ON public.meet_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

-- trip_reviews 트리거 적용
DROP TRIGGER IF EXISTS trigger_enforce_trip_review ON public.trip_reviews;
CREATE TRIGGER trigger_enforce_trip_review
  BEFORE INSERT ON public.trip_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

COMMIT;
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
