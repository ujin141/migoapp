-- ============================================================
-- 01b_tables_community.sql - messages, notifications, posts, comments
-- 01a 실행 후 실행하세요
-- ============================================================

-- ======================== messages ========================
CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id    UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content      TEXT,                          -- 표준 컬럼
  text         TEXT,                          -- 프론트 호환 (ChatPage, useRealtimeChat이 text로 insert)
  image_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  group_id     UUID,                          -- 그룹 채팅용 (trip_groups.id 참조)
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- 구버전 호환
  message_type TEXT DEFAULT 'text'
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_group_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  thread_id IN (SELECT thread_id FROM chat_members WHERE user_id = auth.uid())
  OR group_id IS NOT NULL  -- 그룹 메시지는 멤버면 볼 수 있음
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id OR auth.uid() = user_id
);

-- ======================== notifications ========================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  actor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id   UUID,
  target_text TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select_own" ON notifications;
DROP POLICY IF EXISTS "notif_insert"     ON notifications;
DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert"     ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ======================== in_app_notifications ========================
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT,
  type       TEXT DEFAULT 'info',
  read       BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inapp_select_own" ON in_app_notifications;
DROP POLICY IF EXISTS "inapp_insert"     ON in_app_notifications;
DROP POLICY IF EXISTS "inapp_update_own" ON in_app_notifications;
CREATE POLICY "inapp_select_own" ON in_app_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "inapp_insert"     ON in_app_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "inapp_update_own" ON in_app_notifications FOR UPDATE USING (auth.uid() = user_id);

-- ======================== posts ========================
CREATE TABLE IF NOT EXISTS posts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT,
  content    TEXT NOT NULL,
  image_url  TEXT,
  image_urls TEXT[] DEFAULT '{}',
  hidden     BOOLEAN DEFAULT false,
  pinned     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select"     ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_select"     ON posts FOR SELECT USING (hidden = false);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = author_id);

-- ======================== post_likes ========================
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_likes_select" ON post_likes;
DROP POLICY IF EXISTS "post_likes_insert" ON post_likes;
DROP POLICY IF EXISTS "post_likes_delete" ON post_likes;
CREATE POLICY "post_likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- ======================== comments ========================
CREATE TABLE IF NOT EXISTS comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select"     ON comments;
DROP POLICY IF EXISTS "comments_insert"     ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_select"     ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert"     ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = author_id);
