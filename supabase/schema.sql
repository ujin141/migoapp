-- ============================================================
-- MIGO APP - Complete Database Schema (Unified)
-- Last updated: 2026-04-30
-- Run this entire script in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABLE: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name                  TEXT,
  email                 TEXT,
  photo_url             TEXT,
  photo_urls            TEXT[] DEFAULT '{}',
  bio                   TEXT,
  age                   INTEGER,
  gender                TEXT,
  nationality           TEXT,
  location              TEXT,
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  languages             TEXT[] DEFAULT '{}',
  interests             TEXT[] DEFAULT '{}',
  mbti                  TEXT,
  travel_dates          TEXT,
  verified              BOOLEAN DEFAULT false,
  phone_verified        BOOLEAN DEFAULT false,
  phone                 TEXT,
  id_verified           BOOLEAN DEFAULT false,
  trust_score           NUMERIC(4,1) DEFAULT 0.0,
  trust_review_count    INT DEFAULT 0,
  plan                  TEXT DEFAULT 'free',
  is_plus               BOOLEAN DEFAULT false,
  plus_expires_at       TIMESTAMPTZ,
  boost_expires_at      TIMESTAMPTZ,
  boosts_count          INTEGER DEFAULT 0,
  super_likes_left      INTEGER DEFAULT 3,
  super_likes_reset     TIMESTAMPTZ,
  fcm_token             TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  email_verified        BOOLEAN DEFAULT false,
  sns_connected         BOOLEAN DEFAULT false,
  review_verified       BOOLEAN DEFAULT false,
  travel_style          TEXT[] DEFAULT '{}',
  purpose               TEXT,
  user_type             TEXT DEFAULT 'traveler',
  budget_range          TEXT DEFAULT 'mid',
  home_city             TEXT,
  emergency_contact     TEXT,
  emergency_contact_name TEXT,
  agree_marketing       BOOLEAN DEFAULT false,
  preferred_regions     TEXT[] DEFAULT '{}',
  travel_mission        TEXT,
  visited_countries     TEXT[] DEFAULT '{}',
  avg_rating            NUMERIC(3,2) DEFAULT 0,
  review_count          INTEGER DEFAULT 0,
  trip_count            INTEGER DEFAULT 0,
  no_show_count         INTEGER DEFAULT 0,
  instant_meets_count   INTEGER DEFAULT 0,
  banned                BOOLEAN DEFAULT false,
  admin_note            TEXT,
  is_banned             BOOLEAN DEFAULT false,
  ban_reason            TEXT,
  banned_until          TIMESTAMPTZ,
  has_badge             BOOLEAN DEFAULT false,
  earned_badges         TEXT[] DEFAULT '{}',
  profile_theme         TEXT DEFAULT 'default',
  nearby_expires_at     TIMESTAMPTZ,
  notification_prefs    JSONB DEFAULT '{"like":true,"superlike":true,"match":true,"comment":true,"group":true,"system":true}'::jsonb
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select"     ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select"     ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, plan, is_plus, plus_expires_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    'premium',
    true,
    NOW() + INTERVAL '1 day'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error (non-blocking): %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION secure_calculate_trust_score()
RETURNS TRIGGER AS $$
DECLARE
  calculated_score NUMERIC(4,1) := 0;
BEGIN
  IF NEW.phone_verified = true THEN calculated_score := calculated_score + 15; END IF;
  IF NEW.email_verified = true THEN calculated_score := calculated_score + 10; END IF;
  IF NEW.id_verified = true THEN calculated_score := calculated_score + 40; END IF;
  IF NEW.sns_connected = true THEN calculated_score := calculated_score + 15; END IF;
  IF NEW.review_verified = true THEN calculated_score := calculated_score + 20; END IF;

  NEW.trust_score := calculated_score;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_calculate_trust_score ON public.profiles;
CREATE TRIGGER trigger_calculate_trust_score
  BEFORE INSERT OR UPDATE OF phone_verified, email_verified, id_verified, sns_connected, review_verified
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION secure_calculate_trust_score();

CREATE OR REPLACE FUNCTION block_sensitive_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    -- 1. 이용 횟수나 패널티 벌점을 0으로 초기화/롤백하는 행위 방지
    IF NEW.instant_meets_count < OLD.instant_meets_count THEN
      NEW.instant_meets_count := OLD.instant_meets_count;
    END IF;
    IF NEW.no_show_count < OLD.no_show_count THEN
      NEW.no_show_count := OLD.no_show_count;
    END IF;

    -- 2. 프론트엔드에서 무료로 프리미엄 우회를 시도하는 행위 적발 및 무시 (현재 클라이언트 결제로직 의존도 때문에 부분 무시)
    -- 결제 스키마가 완벽히 이전되기 전까지 plan 필드는 제한적으로만 허용하지만,
    -- 관리자 권한 부여 등은 엄격히 차단해야 합니다.
    IF NEW.is_banned != OLD.is_banned THEN
      NEW.is_banned := OLD.is_banned; -- 유저가 본인 밴을 풀 수 없음
    END IF;

    -- 3. [핵심] 사용자가 임의로 인증 뱃지(신분증, 연락처 등)를 True로 변조하는 것을 방어 (Trust Score 어뷰징 원천 차단)
    IF NEW.id_verified != OLD.id_verified THEN NEW.id_verified := OLD.id_verified; END IF;
    IF NEW.phone_verified != OLD.phone_verified THEN NEW.phone_verified := OLD.phone_verified; END IF;
    -- 이메일 인증이나 리뷰 인증 등은 현재 프론트 통신에 의존하므로 로직에 맞게 부분적 허용이 필요하나,
    -- 신분증(id_verified)은 오직 Admin/Edge Function만 권한이 있어야 함.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_block_sensitive_update ON public.profiles;
CREATE TRIGGER trigger_block_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION block_sensitive_profile_updates();

-- TABLE: likes
CREATE TABLE IF NOT EXISTS likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind       TEXT DEFAULT 'like',    -- 'like' | 'super_like'
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select"     ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_select"     ON likes FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "likes_insert_own" ON likes FOR INSERT WITH CHECK (auth.uid() = from_user);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE USING (auth.uid() = from_user);

-- TABLE: matches
CREATE TABLE IF NOT EXISTS matches (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id  UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "matches_select" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;
CREATE POLICY "matches_select" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);

-- TABLE: chat_threads
CREATE TABLE IF NOT EXISTS chat_threads (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group        BOOLEAN DEFAULT false,
  name            TEXT,
  photo           TEXT,       -- alias for UI (photo_url)
  photo_url       TEXT,
  last_message    TEXT,
  unread_count    INTEGER DEFAULT 0,
  meet_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "threads_select" ON chat_threads;
DROP POLICY IF EXISTS "threads_insert" ON chat_threads;
DROP POLICY IF EXISTS "threads_delete" ON chat_threads;
CREATE POLICY "threads_select" ON chat_threads FOR SELECT USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid()) OR is_group = true
);
CREATE POLICY "threads_insert" ON chat_threads FOR INSERT WITH CHECK (true);
CREATE POLICY "threads_delete" ON chat_threads FOR DELETE USING (false);
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS photo            TEXT;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS last_message     TEXT;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS unread_count     INTEGER DEFAULT 0;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS meet_expires_at  TIMESTAMPTZ;
ALTER TABLE chat_threads ADD COLUMN IF NOT EXISTS created_by       UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION set_chat_thread_creator() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_chat_creator ON chat_threads;
CREATE TRIGGER trigger_set_chat_creator
  BEFORE INSERT ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION set_chat_thread_creator();

-- TABLE: chat_members
CREATE TABLE IF NOT EXISTS chat_members (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(thread_id, user_id)
);
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_select" ON chat_members;
DROP POLICY IF EXISTS "members_insert" ON chat_members;

CREATE OR REPLACE FUNCTION check_is_chat_member(target_thread_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_members
    WHERE thread_id = target_thread_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE POLICY "members_select" ON chat_members FOR SELECT USING (
  check_is_chat_member(thread_id)
);

-- 1) 방을 자기가 방금 막 개설한 경우 (created_by = auth.uid)
-- 2) 자기가 이미 해당 방의 소속 멤버인 경우 (초대 권한)
-- 3) 시스템/트리거 강제 주입 (is_group 공개방 등 자기 자신 Insert)
CREATE POLICY "members_insert" ON chat_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND created_by = auth.uid())
  OR
  check_is_chat_member(thread_id)
);

-- TABLE: messages
CREATE TABLE IF NOT EXISTS messages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id    UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content      TEXT,
  image_url    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  group_id     UUID REFERENCES trip_groups(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message_type TEXT DEFAULT 'text'
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  thread_id IN (SELECT thread_id FROM chat_members WHERE user_id = auth.uid())
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- TABLE: notifications
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

-- TABLE: in_app_notifications
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

-- TABLE: posts (Community)
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

-- TABLE: post_likes
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

-- TABLE: comments
CREATE TABLE IF NOT EXISTS comments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  text       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select"    ON comments;
DROP POLICY IF EXISTS "comments_insert"    ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_select"     ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert"     ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = author_id);

-- FUNCTION: get_chosung (한글 초성 추출 함수)
CREATE OR REPLACE FUNCTION get_chosung(word TEXT) RETURNS TEXT AS $$
DECLARE
    chosung TEXT := 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
    result TEXT := '';
    i INT;
    char_code INT;
    cho_idx INT;
BEGIN
    IF word IS NULL THEN RETURN NULL; END IF;
    FOR i IN 1..LENGTH(word) LOOP
        char_code := ascii(SUBSTRING(word FROM i FOR 1));
        IF char_code >= 44032 AND char_code <= 55203 THEN
            cho_idx := (char_code - 44032) / 588;
            result := result || SUBSTRING(chosung FROM cho_idx + 1 FOR 1);
        ELSE
            result := result || SUBSTRING(word FROM i FOR 1);
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- TABLE: trip_groups
CREATE TABLE IF NOT EXISTS trip_groups (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  destination           TEXT,
  dates                 TEXT,
  max_members           INTEGER DEFAULT 4,
  tags                  TEXT[] DEFAULT '{}',
  description           TEXT,
  schedule              TEXT[] DEFAULT '{}',
  entry_fee             INTEGER DEFAULT 0,
  is_premium            BOOLEAN DEFAULT false,
  cover_image           TEXT,
  host_completed_groups INTEGER DEFAULT 0,
  recent_messages       JSONB DEFAULT '[]',
  status                TEXT DEFAULT 'active',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  thread_id             UUID REFERENCES chat_threads(id) ON DELETE SET NULL,
  is_active             BOOLEAN DEFAULT true,
  member_count          INTEGER DEFAULT 0,
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title_chosung         TEXT GENERATED ALWAYS AS (get_chosung(title)) STORED,
  destination_chosung   TEXT GENERATED ALWAYS AS (get_chosung(destination)) STORED
);
ALTER TABLE trip_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "groups_select"     ON trip_groups;
DROP POLICY IF EXISTS "groups_insert_own" ON trip_groups;
DROP POLICY IF EXISTS "groups_update_own" ON trip_groups;
DROP POLICY IF EXISTS "groups_delete_own" ON trip_groups;
CREATE POLICY "groups_select"     ON trip_groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_own" ON trip_groups FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "groups_update_own" ON trip_groups FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "groups_delete_own" ON trip_groups FOR DELETE USING (auth.uid() = host_id);

-- is_active, created_by 인덱스는 ALTER TABLE 이후 섹션에서 생성됩니다 (기존 DB 호환)

-- created_by 인덱스는 ALTER TABLE 이후 섹션에서 생성줍니다 (기존 DB 호환)

-- TABLE: trip_group_members
CREATE TABLE IF NOT EXISTS trip_group_members (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id   UUID REFERENCES trip_groups(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);
ALTER TABLE trip_group_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "group_members_select" ON trip_group_members;
DROP POLICY IF EXISTS "group_members_insert" ON trip_group_members;
DROP POLICY IF EXISTS "group_members_delete" ON trip_group_members;
CREATE POLICY "group_members_select" ON trip_group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert" ON trip_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "group_members_delete" ON trip_group_members FOR DELETE USING (auth.uid() = user_id);

-- TABLE: trip_applications (동행 크루 지원 시스템)
CREATE TABLE IF NOT EXISTS trip_applications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES trip_groups(id) ON DELETE CASCADE,
  applicant_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message       TEXT,
  status        TEXT DEFAULT 'pending',   -- 'pending' | 'approved' | 'rejected'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, applicant_id)
);
ALTER TABLE trip_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trip_app_select"      ON trip_applications;
DROP POLICY IF EXISTS "trip_app_insert"      ON trip_applications;
DROP POLICY IF EXISTS "trip_app_update_host" ON trip_applications;
CREATE POLICY "trip_app_select"      ON trip_applications FOR SELECT USING (true);
CREATE POLICY "trip_app_insert"      ON trip_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "trip_app_update_host" ON trip_applications FOR UPDATE USING (true);

-- Trigger: 지원 상태 변경 시 신청자에게 알림
CREATE OR REPLACE FUNCTION notify_application_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
    VALUES (
      NEW.applicant_id,
      CASE NEW.status
        WHEN 'approved' THEN 'group_approved'
        WHEN 'rejected' THEN 'group_rejected'
        ELSE 'group_status_changed'
      END,
      NULL,
      NEW.group_id,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_status ON trip_applications;
CREATE TRIGGER on_application_status
  AFTER UPDATE ON trip_applications
  FOR EACH ROW EXECUTE FUNCTION notify_application_status();

CREATE OR REPLACE FUNCTION trg_trip_group_create_thread()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  INSERT INTO chat_threads (is_group, name, photo_url)
  VALUES (true, NEW.title, NEW.cover_image)
  RETURNING id INTO v_thread_id;
  NEW.thread_id := v_thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_group_create_thread_on_insert ON trip_groups;
CREATE TRIGGER trg_trip_group_create_thread_on_insert
  BEFORE INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_create_thread();

CREATE OR REPLACE FUNCTION trg_trip_group_insert_host()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_group_members (group_id, user_id)
  VALUES (NEW.id, NEW.host_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_group_insert_host_on_insert ON trip_groups;
CREATE TRIGGER trg_trip_group_insert_host_on_insert
  AFTER INSERT ON trip_groups FOR EACH ROW
  EXECUTE FUNCTION trg_trip_group_insert_host();

CREATE OR REPLACE FUNCTION trg_sync_chat_members()
RETURNS TRIGGER AS $$
DECLARE
  v_thread_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = NEW.group_id;
    IF v_thread_id IS NOT NULL THEN
      INSERT INTO chat_members (thread_id, user_id) VALUES (v_thread_id, NEW.user_id) ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT thread_id INTO v_thread_id FROM trip_groups WHERE id = OLD.group_id;
    IF v_thread_id IS NOT NULL THEN
      DELETE FROM chat_members WHERE thread_id = v_thread_id AND user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_chat_members_on_change ON trip_group_members;
CREATE TRIGGER trg_sync_chat_members_on_change
  AFTER INSERT OR DELETE ON trip_group_members FOR EACH ROW
  EXECUTE FUNCTION trg_sync_chat_members();

-- TABLE: reports
CREATE TABLE IF NOT EXISTS reports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id     UUID, -- Polymorphic ID (User, Post, Group etc.)
  type          TEXT DEFAULT 'user', -- 'user', 'post', 'comment', 'group'
  reason        TEXT NOT NULL,
  details       TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  admin_comment TEXT
);
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_id_fkey;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_insert"       ON reports;
DROP POLICY IF EXISTS "reports_select_own"   ON reports;
DROP POLICY IF EXISTS "reports_select_admin" ON reports;
DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_insert"       ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_own"   ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_select_admin" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));
CREATE INDEX IF NOT EXISTS idx_reports_status     ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- TABLE: marketplace_likes
CREATE TABLE IF NOT EXISTS marketplace_likes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE marketplace_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mlikes_select" ON marketplace_likes;
DROP POLICY IF EXISTS "mlikes_insert" ON marketplace_likes;
DROP POLICY IF EXISTS "mlikes_delete" ON marketplace_likes;
CREATE POLICY "mlikes_select" ON marketplace_likes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mlikes_insert" ON marketplace_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mlikes_delete" ON marketplace_likes FOR DELETE USING (auth.uid() = user_id);

-- TABLE: blocks
CREATE TABLE IF NOT EXISTS blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blocks_select_own" ON blocks;
DROP POLICY IF EXISTS "blocks_insert_own" ON blocks;
DROP POLICY IF EXISTS "blocks_delete_own" ON blocks;
CREATE POLICY "blocks_select_own" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- TABLE: id_verifications
CREATE TABLE IF NOT EXISTS id_verifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  id_type      TEXT NOT NULL DEFAULT 'passport',
  front_url    TEXT,
  back_url     TEXT,
  selfie_url   TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  reviewed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reject_reason TEXT
);
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "idv_select_own" ON id_verifications;
DROP POLICY IF EXISTS "idv_insert_own" ON id_verifications;
DROP POLICY IF EXISTS "idv_admin"      ON id_verifications;
CREATE POLICY "idv_select_own" ON id_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "idv_insert_own" ON id_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "idv_admin"      ON id_verifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TABLE: marketplace_items
CREATE TABLE IF NOT EXISTS marketplace_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  category       TEXT DEFAULT 'tour',
  price          INTEGER DEFAULT 0,
  destination    TEXT,
  duration       TEXT,
  max_people     INTEGER DEFAULT 10,
  current_people INTEGER DEFAULT 0,
  image          TEXT,
  tags           TEXT[] DEFAULT '{}',
  featured       BOOLEAN DEFAULT false,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_select" ON marketplace_items;
DROP POLICY IF EXISTS "marketplace_admin"  ON marketplace_items;
CREATE POLICY "marketplace_select" ON marketplace_items FOR SELECT USING (is_active = true);
CREATE POLICY "marketplace_admin"  ON marketplace_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TABLE: meet_reviews (기존 단순 리뷰 — 하위호환)
CREATE TABLE IF NOT EXISTS meet_reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id)
);
ALTER TABLE meet_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_select"     ON meet_reviews;
DROP POLICY IF EXISTS "reviews_insert_own" ON meet_reviews;
CREATE POLICY "reviews_select"     ON meet_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON meet_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- TABLE: trip_reviews (동행 완료 리뷰 — 별점+태그+코멘트)
CREATE TABLE IF NOT EXISTS trip_reviews (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  thread_id    UUID REFERENCES chat_threads(id) ON DELETE SET NULL,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags         TEXT[]  DEFAULT '{}',
  comment      TEXT,
  destination  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id)
);
ALTER TABLE trip_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_select"     ON trip_reviews;
DROP POLICY IF EXISTS "tr_insert"     ON trip_reviews;
DROP POLICY IF EXISTS "tr_update_own" ON trip_reviews;
CREATE POLICY "tr_select"     ON trip_reviews FOR SELECT USING (true);
CREATE POLICY "tr_insert"     ON trip_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "tr_update_own" ON trip_reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Trigger: 리뷰 삽입 시 profiles.avg_rating 자동 업데이트
CREATE OR REPLACE FUNCTION update_profile_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    avg_rating   = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM trip_reviews WHERE reviewee_id = NEW.reviewee_id),
    review_count = (SELECT COUNT(*) FROM trip_reviews WHERE reviewee_id = NEW.reviewee_id),
    trip_count   = trip_count + 1
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trip_review_insert ON trip_reviews;
CREATE TRIGGER on_trip_review_insert
  AFTER INSERT ON trip_reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_review_stats();

-- TABLE: trip_calendars
CREATE TABLE IF NOT EXISTS trip_calendars (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  destination TEXT,
  start_date  DATE,
  end_date    DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trip_calendars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calendars_select_own" ON trip_calendars;
DROP POLICY IF EXISTS "calendars_insert_own" ON trip_calendars;
DROP POLICY IF EXISTS "calendars_delete_own" ON trip_calendars;
CREATE POLICY "calendars_select_own" ON trip_calendars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calendars_insert_own" ON trip_calendars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calendars_delete_own" ON trip_calendars FOR DELETE USING (auth.uid() = user_id);

-- TABLE: trips
CREATE TABLE IF NOT EXISTS trips (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  destination  TEXT NOT NULL,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  emoji        TEXT DEFAULT '✈️',
  color        TEXT DEFAULT '#6366f1',
  travel_style TEXT[] DEFAULT '{}',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trips_select"     ON trips;
DROP POLICY IF EXISTS "trips_insert_own" ON trips;
DROP POLICY IF EXISTS "trips_update_own" ON trips;
DROP POLICY IF EXISTS "trips_delete_own" ON trips;
CREATE POLICY "trips_select"     ON trips FOR SELECT USING (true);
CREATE POLICY "trips_insert_own" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trips_update_own" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "trips_delete_own" ON trips FOR DELETE USING (auth.uid() = user_id);

-- TABLE: safety_checkins
CREATE TABLE IF NOT EXISTS safety_checkins (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  partner_id    UUID REFERENCES profiles(id),
  meeting_place TEXT,
  meeting_time  TIMESTAMPTZ,
  status        TEXT DEFAULT 'scheduled',
  share_token   TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  location_name TEXT,
  latitude      DOUBLE PRECISION,
  longitude     DOUBLE PRECISION,
  is_sos        BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE safety_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_own"    ON safety_checkins;
DROP POLICY IF EXISTS "checkin_select" ON safety_checkins;
DROP POLICY IF EXISTS "checkin_insert" ON safety_checkins;
DROP POLICY IF EXISTS "checkin_update" ON safety_checkins;
DROP POLICY IF EXISTS "checkin_delete" ON safety_checkins;
CREATE POLICY "checkin_select" ON safety_checkins FOR SELECT USING (true);
CREATE POLICY "checkin_insert" ON safety_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkin_update" ON safety_checkins FOR UPDATE USING (auth.uid() = user_id OR true);
CREATE POLICY "checkin_delete" ON safety_checkins FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_safety_checkins_user_id ON safety_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_status  ON safety_checkins(status);
-- is_sos 인덱스는 ALTER TABLE 이후 섹션에서 생성됩니다 (기존 DB 호환)

CREATE INDEX IF NOT EXISTS idx_safety_checkins_created ON safety_checkins(created_at DESC);

-- TABLE: profile_views (프로필 방문 기록)
CREATE TABLE IF NOT EXISTS profile_views (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id)
);
ALTER TABLE profile_views ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pv_select" ON profile_views;
DROP POLICY IF EXISTS "pv_insert" ON profile_views;
CREATE POLICY "pv_select" ON profile_views FOR SELECT USING (auth.uid() = viewed_id OR auth.uid() = viewer_id);
CREATE POLICY "pv_insert" ON profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- TABLE: subscriptions (구독 플랜 이력)
CREATE TABLE IF NOT EXISTS subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL,           -- 'plus' | 'premium'
  status      TEXT DEFAULT 'active',   -- 'active' | 'cancelled' | 'expired'
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  price_krw   INTEGER DEFAULT 0,
  payment_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_own" ON subscriptions;
DROP POLICY IF EXISTS "sub_admin" ON subscriptions;
CREATE POLICY "sub_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sub_admin" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- TABLE: purchases (아이템 일회성 구매)
CREATE TABLE IF NOT EXISTS purchases (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,
  item_name   TEXT,
  quantity    INTEGER DEFAULT 1,
  price_krw   INTEGER DEFAULT 0,
  payment_ref TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_own" ON purchases;
DROP POLICY IF EXISTS "purchase_admin" ON purchases;
CREATE POLICY "purchase_own" ON purchases FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "purchase_admin" ON purchases FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
);

-- TABLE: user_items (보유 아이템 잔량)
CREATE TABLE IF NOT EXISTS user_items (
  user_id     UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  super_likes INTEGER DEFAULT 3,
  boosts      INTEGER DEFAULT 0,
  nearby_days INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ui_own" ON user_items;
CREATE POLICY "ui_own" ON user_items FOR ALL USING (auth.uid() = user_id);

-- Trigger: 신규 회원 가입 시 user_items 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_items (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_items ON profiles;
CREATE TRIGGER on_profile_created_items
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_items();

-- TABLE: online_status (실시간 온라인 상태)
CREATE TABLE IF NOT EXISTS online_status (
  user_id   UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  city      TEXT,
  lat       DOUBLE PRECISION,
  lng       DOUBLE PRECISION
);
ALTER TABLE online_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "os_select" ON online_status;
DROP POLICY IF EXISTS "os_upsert" ON online_status;
CREATE POLICY "os_select" ON online_status FOR SELECT USING (true);
CREATE POLICY "os_upsert" ON online_status FOR ALL  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng    ON profiles(lat, lng);
CREATE INDEX IF NOT EXISTS idx_likes_from          ON likes(from_user);
CREATE INDEX IF NOT EXISTS idx_likes_to            ON likes(to_user);
CREATE INDEX IF NOT EXISTS idx_messages_thread     ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created       ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user          ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inapp_user          ON in_app_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON trip_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user  ON trip_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_app_group      ON trip_applications(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_app_applicant  ON trip_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_safety_user         ON safety_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_pv_viewed           ON profile_views(viewed_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tr_reviewee         ON trip_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_tr_reviewer         ON trip_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_sub_user            ON subscriptions(user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_user      ON purchases(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_online_status_city  ON online_status(city);
CREATE INDEX IF NOT EXISTS idx_online_status_latln ON online_status(lat, lng);

-- RPC: delete_user
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  DELETE FROM profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- RPC: get_nearby_travelers (NearbyPage 실시간 조회)
CREATE OR REPLACE FUNCTION get_nearby_travelers(
  p_lat       DOUBLE PRECISION,
  p_lng       DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 5,
  p_limit     INTEGER DEFAULT 50
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  age          INTEGER,
  photo_url    TEXT,
  bio          TEXT,
  nationality  TEXT,
  location     TEXT,
  user_type    TEXT,
  tags         TEXT[],
  trust_score  NUMERIC,
  avg_rating   NUMERIC,
  verified     BOOLEAN,
  distance_km  DOUBLE PRECISION,
  is_online    BOOLEAN,
  last_seen    TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.age, p.photo_url, p.bio,
    p.nationality, p.location, p.user_type,
    p.interests AS tags,
    p.trust_score, p.avg_rating, p.verified,
    (6371 * acos(LEAST(1.0,
      cos(radians(p_lat)) * cos(radians(p.lat)) *
      cos(radians(p.lng) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(p.lat))
    ))) AS distance_km,
    COALESCE(os.is_online, false) AS is_online,
    os.last_seen
  FROM profiles p
  LEFT JOIN online_status os ON os.user_id = p.id
  WHERE
    p.lat IS NOT NULL AND p.lng IS NOT NULL
    AND (6371 * acos(LEAST(1.0,
      cos(radians(p_lat)) * cos(radians(p.lat)) *
      cos(radians(p.lng) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(p.lat))
    ))) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: record_superlike (슈퍼라이크 차감 + like 삽입 원자적)
CREATE OR REPLACE FUNCTION record_superlike(p_to_user UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_items   user_items;
BEGIN
  SELECT * INTO v_items FROM user_items WHERE user_id = v_user_id FOR UPDATE;
  IF v_items.super_likes <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'no_superlike_left');
  END IF;
  UPDATE user_items SET super_likes = super_likes - 1, updated_at = NOW()
  WHERE user_id = v_user_id;
  INSERT INTO likes (from_user, to_user, kind)
  VALUES (v_user_id, p_to_user, 'super_like')
  ON CONFLICT (from_user, to_user) DO UPDATE SET kind = 'super_like';
  RETURN json_build_object('success', true, 'remaining', v_items.super_likes - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION record_superlike(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_superlike(UUID) TO authenticated;

-- RPC: check_and_create_match (쌍방 좋아요 시 자동 매칭)
CREATE OR REPLACE FUNCTION check_and_create_match(p_to_user UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_match_exists BOOLEAN;
  v_thread_id    UUID;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes WHERE from_user = p_to_user AND to_user = v_user_id
  ) INTO v_match_exists;

  IF v_match_exists THEN
    INSERT INTO chat_threads (is_group) VALUES (false) RETURNING id INTO v_thread_id;
    INSERT INTO chat_members (thread_id, user_id)
    VALUES (v_thread_id, v_user_id), (v_thread_id, p_to_user)
    ON CONFLICT DO NOTHING;
    INSERT INTO matches (user1_id, user2_id, thread_id)
    VALUES (LEAST(v_user_id, p_to_user), GREATEST(v_user_id, p_to_user), v_thread_id)
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
    INSERT INTO notifications (user_id, type, actor_id, target_id)
    VALUES (p_to_user, 'match', v_user_id, v_thread_id);
    INSERT INTO notifications (user_id, type, actor_id, target_id)
    VALUES (v_user_id, 'match', p_to_user, v_thread_id);
    RETURN json_build_object('matched', true, 'thread_id', v_thread_id);
  END IF;
  RETURN json_build_object('matched', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION check_and_create_match(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_and_create_match(UUID) TO authenticated;

-- REALTIME
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

-- TABLE: travel_check_ins (GPS 도착 체크인)
CREATE TABLE IF NOT EXISTS travel_check_ins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  city          TEXT NOT NULL,
  country       TEXT NOT NULL DEFAULT '',
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);
ALTER TABLE travel_check_ins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_select"    ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_insert"    ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_update"    ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_delete"    ON travel_check_ins;
CREATE POLICY "checkin_select" ON travel_check_ins FOR SELECT USING (true);
CREATE POLICY "checkin_insert" ON travel_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkin_update" ON travel_check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "checkin_delete" ON travel_check_ins FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ============================================================

-- messages: 그룹 채팅 지원
ALTER TABLE messages ADD COLUMN IF NOT EXISTS group_id     UUID REFERENCES trip_groups(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- reports: 어드민 처리 컬럼
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_comment TEXT;

-- id_verifications: 어드민 처리 컬럼
ALTER TABLE id_verifications ADD COLUMN IF NOT EXISTS reviewed_by    UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE id_verifications ADD COLUMN IF NOT EXISTS reject_reason  TEXT;

CREATE INDEX IF NOT EXISTS idx_trip_groups_is_active   ON trip_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_trip_groups_created_at  ON trip_groups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_group_id       ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at     ON messages(created_at DESC);

-- RLS: messages (user_id로도 INSERT 가능)
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE trip_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE trip_groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_member_count ON trip_group_members;
CREATE TRIGGER trg_sync_member_count
  AFTER INSERT OR DELETE ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users            BIGINT,
  new_users_today        BIGINT,
  total_posts            BIGINT,
  total_groups           BIGINT,
  active_groups          BIGINT,
  pending_reports        BIGINT,
  sos_checkins           BIGINT,
  active_chat_rooms      BIGINT,
  pending_verifications  BIGINT,
  total_marketplace      BIGINT
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles)                                                     AS total_users,
    (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE)                   AS new_users_today,
    (SELECT COUNT(*) FROM posts)                                                        AS total_posts,
    (SELECT COUNT(*) FROM trip_groups)                                                  AS total_groups,
    (SELECT COUNT(*) FROM trip_groups WHERE is_active = true)                           AS active_groups,
    (SELECT COUNT(*) FROM reports WHERE status = 'pending')                             AS pending_reports,
    (SELECT COUNT(*) FROM safety_checkins WHERE is_sos = true AND status != 'resolved') AS sos_checkins,
    (SELECT COUNT(*) FROM trip_groups WHERE is_active = true)                           AS active_chat_rooms,
    (SELECT COUNT(*) FROM id_verifications WHERE status = 'pending')                   AS pending_verifications,
    (SELECT COUNT(*) FROM marketplace_items WHERE is_active = true)                    AS total_marketplace;
$$;

CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id UUID,
  reason         TEXT DEFAULT NULL,
  ban_days       INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET
    is_banned    = true,
    ban_reason   = reason,
    banned_until = CASE WHEN ban_days IS NOT NULL THEN NOW() + (ban_days || ' days')::INTERVAL ELSE NULL END
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_unban_user(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET is_banned = false, ban_reason = NULL, banned_until = NULL
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_resolve_report(
  report_id UUID,
  action    TEXT,
  comment   TEXT DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reports
  SET status = action, admin_comment = comment, resolved_at = NOW()
  WHERE id = report_id;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_approve_verification(verif_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  UPDATE id_verifications SET status = 'approved', reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET verified = true WHERE id = v_user_id;
  END IF;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_verification(verif_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE id_verifications
  SET status = 'rejected', reject_reason = reason, reviewed_at = NOW()
  WHERE id = verif_id;
  RETURN FOUND;
END;
$$;

DROP VIEW IF EXISTS admin_sos_active;
CREATE VIEW admin_sos_active AS
SELECT
  sc.id,
  sc.user_id,
  sc.location_name,
  sc.latitude,
  sc.longitude,
  sc.status,
  sc.is_sos,
  sc.created_at,
  sc.updated_at,
  p.name      AS user_name,
  p.photo_url AS user_photo,
  p.email     AS user_email
FROM safety_checkins sc
JOIN profiles p ON p.id = sc.user_id
WHERE sc.is_sos = true AND sc.status != 'resolved'
ORDER BY sc.created_at DESC;

DROP VIEW IF EXISTS admin_chat_room_summary;
CREATE VIEW admin_chat_room_summary AS
SELECT
  tg.id,
  tg.title,
  tg.description,
  tg.is_active,
  tg.member_count,
  tg.max_members,
  tg.created_at,
  tg.created_by,
  p.name      AS creator_name,
  p.photo_url AS creator_photo,
  (SELECT COUNT(*) FROM messages m WHERE m.group_id = tg.id)        AS message_count,
  (SELECT MAX(m.created_at) FROM messages m WHERE m.group_id = tg.id) AS last_message_at
FROM trip_groups tg
LEFT JOIN profiles p ON p.id = COALESCE(tg.created_by, tg.host_id)
ORDER BY tg.created_at DESC;

DROP VIEW IF EXISTS admin_user_summary;
CREATE VIEW admin_user_summary AS
SELECT
  p.id,
  p.name,
  p.email,
  p.photo_url,
  p.nationality,
  p.verified,
  p.is_plus,
  p.plan,
  p.is_banned,
  p.ban_reason,
  p.banned_until,
  p.admin_note,
  p.created_at,
  COALESCE(r.report_count, 0) AS received_reports,
  COALESCE(pv.view_count, 0)  AS profile_views
FROM profiles p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS report_count FROM reports WHERE target_id = p.id
) r ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS view_count FROM profile_views WHERE viewed_id = p.id
) pv ON true;

CREATE OR REPLACE FUNCTION public.find_email_by_phone(p_name TEXT, p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT; v_at INT; v_local TEXT;
BEGIN
  SELECT email INTO v_email FROM public.profiles
  WHERE name = p_name AND phone = p_phone LIMIT 1;
  IF v_email IS NULL THEN RETURN NULL; END IF;
  v_at := position('@' IN v_email);
  IF v_at > 0 THEN
    v_local := substring(v_email from 1 for v_at - 1);
    IF length(v_local) <= 2 THEN
      RETURN substring(v_local,1,1) || '***' || substring(v_email from v_at);
    ELSE
      RETURN substring(v_local,1,2) || repeat('*', length(v_local)-2) || substring(v_email from v_at);
    END IF;
  END IF;
  RETURN v_email;
END;
$$;
GRANT EXECUTE ON FUNCTION public.find_email_by_phone(TEXT, TEXT) TO authenticated, anon;

-- 2) chat_threads 정책 추가 (자동 폭파·업데이트용)
DROP POLICY IF EXISTS "threads_delete" ON chat_threads;
CREATE POLICY "threads_delete" ON chat_threads FOR DELETE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);

DROP POLICY IF EXISTS "threads_update" ON chat_threads;
CREATE POLICY "threads_update" ON chat_threads FOR UPDATE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);

-- 3) meet_expires_at 인덱스 (만료 시간 기반 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_chat_threads_expires
  ON chat_threads (meet_expires_at)
  WHERE meet_expires_at IS NOT NULL;

-- ============================================================
-- Supabase에서 pg_cron extension이 활성화된 경우,
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_chat_threads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- meet_expires_at 이 현재 시각보다 이전인 채팅방 삭제
  -- (cascade로 messages, chat_members도 함께 삭제됨)
  DELETE FROM chat_threads
  WHERE meet_expires_at IS NOT NULL
    AND meet_expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() TO authenticated, service_role;

-- pg_cron 스케줄: Supabase 대시보드 > Database > Cron jobs 에서 직접 설정

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_badge         BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS earned_badges     TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_theme     TEXT DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nearby_expires_at TIMESTAMPTZ;

-- 1) 컬럼이 아직 없으면 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role     TEXT    DEFAULT 'user';

-- 2) 관리자 지정
UPDATE profiles
SET
  is_admin = true,
  role     = 'admin'
WHERE id = (
  SELECT id
  FROM auth.users
  WHERE email = 'ujin141@naver.com'
  LIMIT 1
);

-- TABLE: hotplace_seekers (핫플 동반자 구하기)
CREATE TABLE IF NOT EXISTS public.hotplace_seekers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotplace_id TEXT        NOT NULL,
  message     TEXT,
  meet_date   TEXT,                      -- YYYY-MM-DD (선택)
  meet_time   TEXT,                      -- HH:MM (선택)
  max_members INTEGER     DEFAULT 4,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS hotplace_seekers_user_hotplace_idx
  ON public.hotplace_seekers (user_id, hotplace_id);

CREATE INDEX IF NOT EXISTS hotplace_seekers_hotplace_id_idx
  ON public.hotplace_seekers (hotplace_id, created_at DESC);

-- Realtime 구독 지원 (MapPage.tsx INSERT 실시간 수신용)
ALTER TABLE public.hotplace_seekers REPLICA IDENTITY FULL;

ALTER TABLE public.hotplace_seekers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotplace_seekers_select" ON public.hotplace_seekers;
DROP POLICY IF EXISTS "hotplace_seekers_insert" ON public.hotplace_seekers;
DROP POLICY IF EXISTS "hotplace_seekers_delete" ON public.hotplace_seekers;

CREATE POLICY "hotplace_seekers_select"
  ON public.hotplace_seekers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "hotplace_seekers_insert"
  ON public.hotplace_seekers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hotplace_seekers_delete"
  ON public.hotplace_seekers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- NOTIFICATION TRIGGERS

-- likes 테이블에 INSERT 되면 받는 사람에게 알림을 생성
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.from_user = NEW.to_user THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (
    NEW.to_user,
    CASE NEW.kind
      WHEN 'super_like' THEN 'superlike'
      WHEN 'superlike'  THEN 'superlike'
      ELSE 'like'
    END,
    NEW.from_user,
    NULL
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_like ON likes;
CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- matches 테이블에 INSERT 되면 양쪽 유저에게 match 알림 생성
CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  -- user1 → user2 에게 알림
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user2_id, 'match', NEW.user1_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;

  -- user2 → user1 에게 알림
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user1_id, 'match', NEW.user2_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_match ON matches;
CREATE TRIGGER trg_notify_on_match
  AFTER INSERT ON matches
  FOR EACH ROW EXECUTE FUNCTION notify_on_match();

-- comments 테이블에 INSERT 되면 게시글 작성자에게 알림
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author
  FROM posts WHERE id = NEW.post_id;

  IF v_post_author IS NULL OR v_post_author = NEW.author_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (
    v_post_author,
    'comment',
    NEW.author_id,
    NEW.post_id,
    LEFT(NEW.text, 80)  -- 미리보기 텍스트 (80자 제한)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- trip_group_members INSERT 시 그룹 호스트에게 알림
CREATE OR REPLACE FUNCTION notify_on_group_join()
RETURNS TRIGGER AS $$
DECLARE
  v_host_id  UUID;
  v_title    TEXT;
BEGIN
  SELECT host_id, title INTO v_host_id, v_title
  FROM trip_groups WHERE id = NEW.group_id;

  IF v_host_id IS NULL OR v_host_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (
    v_host_id,
    'group_join',
    NEW.user_id,
    NEW.group_id,
    v_title
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_group_join ON trip_group_members;
CREATE TRIGGER trg_notify_on_group_join
  AFTER INSERT ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION notify_on_group_join();

DELETE FROM notifications
WHERE type = 'profile_view'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, actor_id) id
    FROM notifications
    WHERE type = 'profile_view'
    ORDER BY user_id, actor_id, created_at DESC
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_profile_view_dedup
  ON notifications (user_id, actor_id, type)
  WHERE type = 'profile_view';

DO $$
BEGIN
  BEGIN
    ALTER TABLE notifications REPLICA IDENTITY FULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;

-- ============================================================
-- ============================================================

-- [1] profiles: 사용자별 알림 수신 설정 컬럼 추가 (기존 DB 멱등 적용)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB
  DEFAULT '{"like":true,"superlike":true,"match":true,"comment":true,"group":true,"system":true}'::jsonb;

-- [2] profiles: FCM 디바이스 토큰 컬럼 추가 (기존 DB 멱등 적용)
-- iOS: APNs → Firebase → FCM 토큰 자동 매핑 (AppDelegate.swift 참조)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- ============================================================
-- DATABASE WEBHOOKS (Supabase 대시보드에서 수동 설정 필요)
-- ============================================================
--   Table: notifications | Event: INSERT
--   → like / superlike / match / comment / group_join 푸쉬
--
--   Table: messages | Event: INSERT
--   → 채팅 메시지 수신 푸쉬
--
--   Table: in_app_notifications | Event: INSERT
--   → 관리자 브로드캐스트 및 시스템 알림 푸쉬
-- ============================================================

-- [3] 푸쉬 알림 테스트 쿼리 (SQL Editor에서 직접 실행하여 파이프라인 검증)
/*
INSERT INTO in_app_notifications (user_id, type, title, content)
VALUES (
  '<YOUR_USER_UUID>',
  'system',
  '🔔 푸쉬 알림 테스트',
  '푸쉬 알림 파이프라인이 정상 작동합니다.'
);
*/

-- [4] notification_prefs 인덱스 (JSONB 키 기반 빠른 필터링, 선택적)
-- CREATE INDEX IF NOT EXISTS idx_profiles_notif_prefs
--   ON profiles USING GIN (notification_prefs);
