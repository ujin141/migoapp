-- ============================================================
-- 10_schema_fixes.sql
-- 프론트엔드 ↔ DB 스키마 불일치 전수 수정 패치
-- 기존 테이블이 있을 경우 ALTER TABLE로 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 04_admin_complete.sql 이후 실행
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. profiles 누락 컬럼
-- ─────────────────────────────────────────────
-- useAuth.ts, LoginPage.tsx: setup_complete 체크
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS setup_complete   BOOLEAN DEFAULT false;
-- VerificationPage.tsx: sns_handle 저장
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sns_handle       TEXT;
-- 08_retention_push.sql: 마지막 활동 추적
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at  TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────
-- 2. messages 누락 컬럼
-- ─────────────────────────────────────────────
-- ChatPage.tsx, useRealtimeChat.ts, TripMatchPage.tsx: text 컬럼으로 insert
-- SQL 스키마엔 content만 있어서 insert 실패함
ALTER TABLE messages ADD COLUMN IF NOT EXISTS text TEXT;

-- ─────────────────────────────────────────────
-- 3. reports 누락 컬럼
-- ─────────────────────────────────────────────
-- ChatPage.tsx: reported_user_id 컬럼으로 insert
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- 4. chat_threads 누락 컬럼
-- ─────────────────────────────────────────────
-- ChatPage.tsx/ProfilePage.tsx에서 last_message_at 정렬에 사용될 수 있음
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────
-- 5. trip_groups 누락 컬럼
-- ─────────────────────────────────────────────
-- DiscoverPage.tsx: cover_image, entry_fee, is_premium 사용
ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS entry_fee   INTEGER DEFAULT 0;
ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS is_premium  BOOLEAN DEFAULT false;

-- ─────────────────────────────────────────────
-- 6. messages: text ↔ content 동기화 트리거
-- (text로 insert하면 content에도 반영, vice versa)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_message_text_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- text로 insert됐는데 content가 비어있으면 동기화
  IF NEW.text IS NOT NULL AND NEW.content IS NULL THEN
    NEW.content := NEW.text;
  END IF;
  -- content로 insert됐는데 text가 비어있으면 동기화
  IF NEW.content IS NOT NULL AND NEW.text IS NULL THEN
    NEW.text := NEW.content;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_message_text ON messages;
CREATE TRIGGER trg_sync_message_text
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION sync_message_text_content();

-- ─────────────────────────────────────────────
-- 7. chat_threads last_message_at 자동 업데이트 트리거
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_threads
  SET last_message     = COALESCE(NEW.text, NEW.content),
      last_message_at  = NEW.created_at,
      updated_at       = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_thread_last_msg ON messages;
CREATE TRIGGER trg_update_thread_last_msg
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_thread_last_message();

-- ─────────────────────────────────────────────
-- 8. touch_active RPC (MatchPage, 온라인 상태 갱신)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_active()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE online_status
  SET is_online = true, last_seen = NOW()
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    INSERT INTO online_status (user_id, is_online, last_seen)
    VALUES (auth.uid(), true, NOW())
    ON CONFLICT (user_id) DO UPDATE SET is_online = true, last_seen = NOW();
  END IF;

  -- profiles.last_active_at 갱신
  UPDATE profiles SET last_active_at = NOW() WHERE id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION touch_active() TO authenticated;

-- ─────────────────────────────────────────────
-- 9. Realtime 구독 활성화 (누락 테이블 추가)
-- ─────────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages', 'chat_messages', 'online_status', 'hotplace_seekers', 'sos_alerts']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- ignore
    END;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────
-- 10. Storage 버킷 (avatars, posts, id-docs)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',  'avatars',  true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('posts',    'posts',    true,  10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('id-docs',  'id-docs',  false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/pdf']),
  ('ad-images','ad-images',true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 완료
-- ─────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Schema fixes applied!';
  RAISE NOTICE '   profiles: setup_complete, sns_handle, last_active_at 추가';
  RAISE NOTICE '   messages: text 컬럼 추가 + content 동기화 트리거';
  RAISE NOTICE '   reports: reported_user_id 추가';
  RAISE NOTICE '   chat_threads: last_message_at, updated_at 추가 + 자동 업데이트 트리거';
  RAISE NOTICE '   trip_groups: cover_image, entry_fee, is_premium 추가';
  RAISE NOTICE '   touch_active() RPC 생성';
  RAISE NOTICE '   Realtime 구독 + Storage 버킷 설정';
END $$;
