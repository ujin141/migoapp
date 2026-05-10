-- ============================================================
-- 06_realtime_storage.sql - Realtime 구독 + Storage 버킷
-- 마지막에 실행하세요
-- ============================================================

-- REALTIME 구독 설정
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['matches','messages','notifications','trip_reviews','online_status']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END;
$$;

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('id-docs', 'id-docs', false) ON CONFLICT (id) DO NOTHING;

-- Storage 정책
DROP POLICY IF EXISTS "avatar_all_public"  ON storage.objects;
CREATE POLICY "avatar_all_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatar_upload_own"  ON storage.objects;
CREATE POLICY "avatar_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "posts_all_public"   ON storage.objects;
CREATE POLICY "posts_all_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "posts_upload_own"   ON storage.objects;
CREATE POLICY "posts_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "id_docs_own"        ON storage.objects;
CREATE POLICY "id_docs_own" ON storage.objects
  FOR ALL USING (bucket_id = 'id-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
