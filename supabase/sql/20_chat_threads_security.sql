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
