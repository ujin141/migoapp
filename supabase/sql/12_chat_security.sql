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
