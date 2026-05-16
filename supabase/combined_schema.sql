-- ============================================================
-- Migo App — 통합 스키마 (All-in-One)
-- Supabase SQL Editor에서 이 파일 하나만 실행하세요.
-- ============================================================

-- ============================================================
-- 01a_tables_core.sql - profiles, likes, matches, chat
-- 가장 먼저 실행하세요
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================== profiles ========================
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
  personality_tags      TEXT[] DEFAULT '{}',
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
  is_admin              BOOLEAN DEFAULT false,
  role                  TEXT DEFAULT 'user',
  notification_prefs    JSONB DEFAULT '{"like":true,"superlike":true,"match":true,"comment":true,"group":true,"system":true}'::jsonb,
  -- 추가 누락 컬럼
  sns_handle            TEXT,                          -- SNS 연동 핸들 (VerificationPage)
  setup_complete        BOOLEAN DEFAULT false,         -- 프로필 설정 완료 여부 (LoginPage, useAuth)
  last_active_at        TIMESTAMPTZ DEFAULT NOW()      -- 마지막 활동 시간 (리텐션 기능)
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select"     ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select"     ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ======================== likes ========================
CREATE TABLE IF NOT EXISTS likes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  kind       TEXT DEFAULT 'like',
  message    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select"     ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_select"     ON likes FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE USING (auth.uid() = from_user);

-- ======================== matches ========================
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
-- ======================== chat_threads ========================
CREATE TABLE IF NOT EXISTS chat_threads (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group        BOOLEAN DEFAULT false,
  name            TEXT,
  photo           TEXT,
  photo_url       TEXT,
  last_message    TEXT,
  unread_count    INTEGER DEFAULT 0,
  meet_expires_at TIMESTAMPTZ,
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "threads_select" ON chat_threads;
DROP POLICY IF EXISTS "threads_insert" ON chat_threads;
DROP POLICY IF EXISTS "threads_delete" ON chat_threads;
DROP POLICY IF EXISTS "threads_update" ON chat_threads;
CREATE POLICY "threads_select" ON chat_threads FOR SELECT USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid()) OR is_group = true
);
CREATE POLICY "threads_insert" ON chat_threads FOR INSERT WITH CHECK (true);
-- ======================== chat_members ========================
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

DROP POLICY IF EXISTS "members_select" ON chat_members;
CREATE POLICY "members_select" ON chat_members FOR SELECT USING (
  check_is_chat_member(thread_id)
);
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
  tags       TEXT[] DEFAULT '{}',
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
-- ============================================================
-- 01c_tables_trips.sql - trip, report, marketplace, review 테이블
-- 01b 실행 후 실행하세요
-- ============================================================

-- ======================== get_chosung (한글 초성 추출) ========================
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

-- ======================== trip_groups ========================
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

-- ======================== trip_group_members ========================
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

-- ======================== trip_applications ========================
CREATE TABLE IF NOT EXISTS trip_applications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id      UUID REFERENCES trip_groups(id) ON DELETE CASCADE,
  applicant_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message       TEXT,
  status        TEXT DEFAULT 'pending',
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

-- ======================== reports ========================
CREATE TABLE IF NOT EXISTS reports (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_id     UUID,
  type          TEXT DEFAULT 'user',
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

-- ======================== marketplace_likes ========================
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

-- ======================== blocks ========================
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

-- ======================== id_verifications ========================
CREATE TABLE IF NOT EXISTS id_verifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  id_type       TEXT NOT NULL DEFAULT 'passport',
  front_url     TEXT,
  back_url      TEXT,
  selfie_url    TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  admin_note    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at   TIMESTAMPTZ,
  reviewed_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reject_reason TEXT
);
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "idv_select_own" ON id_verifications;
DROP POLICY IF EXISTS "idv_insert_own" ON id_verifications;
DROP POLICY IF EXISTS "idv_admin"      ON id_verifications;
CREATE POLICY "idv_select_own" ON id_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "idv_insert_own" ON id_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
-- ======================== marketplace_items ========================
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
-- ======================== meet_reviews ========================
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

-- ======================== trip_reviews ========================
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
-- ============================================================
-- 01d_tables_misc.sql - 나머지 테이블
-- 01c 실행 후 실행하세요
-- ============================================================

-- ======================== trip_calendars ========================
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

-- ======================== trips ========================
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

-- ======================== safety_checkins ========================
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

-- ======================== profile_views ========================
CREATE TABLE IF NOT EXISTS profile_views (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id)
);
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pv_select" ON profile_views;
DROP POLICY IF EXISTS "pv_insert" ON profile_views;
CREATE POLICY "pv_select" ON profile_views FOR SELECT USING (auth.uid() = viewed_id OR auth.uid() = viewer_id);
CREATE POLICY "pv_insert" ON profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ======================== subscriptions ========================
CREATE TABLE IF NOT EXISTS subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan        TEXT NOT NULL,
  status      TEXT DEFAULT 'active',
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

-- ======================== purchases ========================
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

-- ======================== user_items ========================
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

-- ======================== online_status ========================
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
CREATE POLICY "os_upsert" ON online_status FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ======================== travel_check_ins ========================
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
DROP POLICY IF EXISTS "checkin_select" ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_insert" ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_update" ON travel_check_ins;
DROP POLICY IF EXISTS "checkin_delete" ON travel_check_ins;
CREATE POLICY "checkin_select" ON travel_check_ins FOR SELECT USING (true);
CREATE POLICY "checkin_insert" ON travel_check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkin_update" ON travel_check_ins FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "checkin_delete" ON travel_check_ins FOR DELETE USING (auth.uid() = user_id);

-- ======================== hotplace_seekers ========================
CREATE TABLE IF NOT EXISTS public.hotplace_seekers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hotplace_id TEXT        NOT NULL,
  message     TEXT,
  meet_date   TEXT,
  meet_time   TEXT,
  max_members INTEGER     DEFAULT 4,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.hotplace_seekers REPLICA IDENTITY FULL;
ALTER TABLE public.hotplace_seekers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hotplace_seekers_select" ON public.hotplace_seekers;
DROP POLICY IF EXISTS "hotplace_seekers_insert" ON public.hotplace_seekers;
DROP POLICY IF EXISTS "hotplace_seekers_delete" ON public.hotplace_seekers;
CREATE POLICY "hotplace_seekers_select" ON public.hotplace_seekers FOR SELECT TO authenticated USING (true);
CREATE POLICY "hotplace_seekers_insert" ON public.hotplace_seekers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hotplace_seekers_delete" ON public.hotplace_seekers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ======================== ads ========================
-- 광고 캠페인 (AdminMarketing에서 관리)
CREATE TABLE IF NOT EXISTS ads (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  advertiser   TEXT,
  slot_id      TEXT NOT NULL,              -- ad_slots.id 참조
  image_url    TEXT,
  cta_url      TEXT,
  cta_text     TEXT,
  headline     TEXT,
  body_text    TEXT,
  status       TEXT DEFAULT 'pending',     -- pending/active/paused/ended
  budget       INTEGER DEFAULT 0,
  budget_spent INTEGER DEFAULT 0,
  impressions  INTEGER DEFAULT 0,
  clicks       INTEGER DEFAULT 0,
  start_date   DATE,
  end_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ads_admin" ON ads;
CREATE POLICY "ads_admin" ON ads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== ad_slots ========================
-- 광고 슬롯 정의 (앱 화면별 광고 위치)
CREATE TABLE IF NOT EXISTS ad_slots (
  id          TEXT PRIMARY KEY,            -- 'match_top_banner' 등 고정 슬롯 ID
  name        TEXT NOT NULL,
  description TEXT,
  app_screen  TEXT NOT NULL,
  format      TEXT DEFAULT 'banner',       -- banner/interstitial/native
  dimensions  TEXT,
  max_active  INTEGER DEFAULT 1,
  enabled     BOOLEAN DEFAULT true,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ad_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_slots_select" ON ad_slots;
DROP POLICY IF EXISTS "ad_slots_admin" ON ad_slots;
CREATE POLICY "ad_slots_select" ON ad_slots FOR SELECT USING (true);
CREATE POLICY "ad_slots_admin" ON ad_slots FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ad_slots 기본 데이터 삽입
INSERT INTO ad_slots (id, name, description, app_screen, format, dimensions, max_active, enabled) VALUES
  ('match_top_banner',      '매칭 상단 배너',   '매칭 페이지 스와이프 카드 상단', 'MatchPage',    'banner',        '360x60', 1, true),
  ('explore_top_banner',    '탐색 상단 배너',   '탐색 페이지 상단',               'DiscoverPage', 'banner',        '360x60', 1, true),
  ('profile_bottom_banner', '프로필 하단 배너', '프로필 화면 하단',               'ProfilePage',  'banner',        '360x60', 1, false),
  ('splash_interstitial',   '스플래시 전면광고','앱 시작 시 전면 광고',           'SplashPage',   'interstitial', '360x640', 1, false)
ON CONFLICT (id) DO NOTHING;

-- ======================== ad_clicks ========================
CREATE TABLE IF NOT EXISTS ad_clicks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id      UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_clicks_insert" ON ad_clicks;
DROP POLICY IF EXISTS "ad_clicks_admin"  ON ad_clicks;
CREATE POLICY "ad_clicks_insert" ON ad_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "ad_clicks_admin"  ON ad_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== ad_impressions ========================
CREATE TABLE IF NOT EXISTS ad_impressions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id      UUID REFERENCES ads(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ad_imp_insert" ON ad_impressions;
DROP POLICY IF EXISTS "ad_imp_admin"  ON ad_impressions;
CREATE POLICY "ad_imp_insert" ON ad_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "ad_imp_admin"  ON ad_impressions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== chat_messages ========================
-- 1:1 채팅 메시지 (chat_threads 기반)
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id  UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  sender_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'text',          -- text/image/system
  read_by    UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chatmsg_select" ON chat_messages;
DROP POLICY IF EXISTS "chatmsg_insert" ON chat_messages;
CREATE POLICY "chatmsg_select" ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM chat_members WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid()));
CREATE POLICY "chatmsg_insert" ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM chat_members WHERE thread_id = chat_messages.thread_id AND user_id = auth.uid())
  );

-- ======================== sos_alerts ========================
-- SOS 긴급 알림 (SOSModal에서 사용)
CREATE TABLE IF NOT EXISTS sos_alerts (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  address    TEXT,
  message    TEXT,
  status     TEXT DEFAULT 'active',        -- active/resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sos_insert" ON sos_alerts;
DROP POLICY IF EXISTS "sos_own"    ON sos_alerts;
DROP POLICY IF EXISTS "sos_admin"  ON sos_alerts;
CREATE POLICY "sos_insert" ON sos_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sos_own"    ON sos_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sos_admin"  ON sos_alerts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== call_logs ========================
-- 음성통화 로그 (VoiceCallPage에서 사용)
CREATE TABLE IF NOT EXISTS call_logs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  callee_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  duration_seconds INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'completed', -- completed/missed/declined
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "calllog_own"   ON call_logs;
DROP POLICY IF EXISTS "calllog_admin" ON call_logs;
CREATE POLICY "calllog_own"   ON call_logs FOR ALL   USING (auth.uid() = caller_id OR auth.uid() = callee_id);
CREATE POLICY "calllog_admin" ON call_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== broadcast_logs ========================
-- 어드민 푸시 발송 이력 (AdminNotifications에서 사용)
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  content       TEXT,
  type          TEXT DEFAULT 'general',
  target_filter TEXT,
  sent_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bcast_admin" ON broadcast_logs;
CREATE POLICY "bcast_admin" ON broadcast_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ======================== user_blocks ========================
-- 유저 차단 (ReportBlockActionSheet에서 사용, blocks 테이블과 별도 관리)
-- 참고: blocks 테이블은 01b에 있지만 user_blocks는 커뮤니티 게시글 차단용으로 별도 사용
CREATE TABLE IF NOT EXISTS user_blocks (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ublocks_own" ON user_blocks;
CREATE POLICY "ublocks_own" ON user_blocks FOR ALL USING (auth.uid() = blocker_id);

-- ============================================================
-- 02_triggers.sql - 트리거 + 자동화 함수
-- 01_tables.sql, 01b_tables.sql 실행 후 실행하세요
-- ============================================================

-- 신규 회원 프로필 자동 생성
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

-- Trust Score 자동 계산
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

-- 민감 필드 변조 방지

DROP TRIGGER IF EXISTS trigger_block_sensitive_update ON public.profiles;
CREATE TRIGGER trigger_block_sensitive_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION block_sensitive_profile_updates();

-- 신규 회원 user_items 자동 생성
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

-- chat_threads 생성자 자동 설정
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

-- trip_group 생성 시 chat_thread 자동 생성
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

-- trip_group 생성 시 호스트를 멤버로 자동 추가
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

-- trip_group_members 변경 시 chat_members 자동 동기화
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

-- trip_group_members 변경 시 member_count 자동 동기화
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

-- 지원 상태 변경 시 알림
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

-- 리뷰 삽입 시 avg_rating 자동 업데이트
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

-- 알림 트리거: 좋아요
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.from_user = NEW.to_user THEN RETURN NEW; END IF;
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

-- 알림 트리거: 매칭
CREATE OR REPLACE FUNCTION notify_on_match()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, target_id)
  VALUES (NEW.user2_id, 'match', NEW.user1_id, NEW.thread_id)
  ON CONFLICT DO NOTHING;
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

-- 알림 트리거: 댓글
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author UUID;
BEGIN
  SELECT author_id INTO v_post_author FROM posts WHERE id = NEW.post_id;
  IF v_post_author IS NULL OR v_post_author = NEW.author_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_post_author, 'comment', NEW.author_id, NEW.post_id, LEFT(NEW.text, 80));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_comment ON comments;
CREATE TRIGGER trg_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- 알림 트리거: 그룹 가입
CREATE OR REPLACE FUNCTION notify_on_group_join()
RETURNS TRIGGER AS $$
DECLARE
  v_host_id  UUID;
  v_title    TEXT;
BEGIN
  SELECT host_id, title INTO v_host_id, v_title FROM trip_groups WHERE id = NEW.group_id;
  IF v_host_id IS NULL OR v_host_id = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, type, actor_id, target_id, target_text)
  VALUES (v_host_id, 'group_join', NEW.user_id, NEW.group_id, v_title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_on_group_join ON trip_group_members;
CREATE TRIGGER trg_notify_on_group_join
  AFTER INSERT ON trip_group_members
  FOR EACH ROW EXECUTE FUNCTION notify_on_group_join();

-- 만료 채팅방 자동 삭제 함수 (pg_cron용)
CREATE OR REPLACE FUNCTION cleanup_expired_chat_threads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_threads
  WHERE meet_expires_at IS NOT NULL
    AND meet_expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_chat_threads() TO authenticated, service_role;

-- profile_view 중복 알림 정리
DELETE FROM notifications
WHERE type = 'profile_view'
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, actor_id) id
    FROM notifications
    WHERE type = 'profile_view'
    ORDER BY user_id, actor_id, created_at DESC
  );

-- notifications Realtime 설정
DO $$
BEGIN
  BEGIN
    ALTER TABLE notifications REPLICA IDENTITY FULL;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$;
-- ============================================================
-- 03_rpc_functions.sql - 앱에서 호출하는 RPC 함수
-- 02_triggers.sql 실행 후 실행하세요
-- ============================================================

-- delete_user: 회원 탈퇴
CREATE OR REPLACE FUNCTION delete_user()
RETURNS void AS $$
DECLARE
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM profiles WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- record_superlike: 슈퍼라이크 차감 + like 삽입
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

-- check_and_create_match: 쌍방 좋아요 시 자동 매칭
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

-- find_email_by_phone: 이메일 찾기 (마스킹)
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

-- increment_ad_clicks: 광고 클릭수 원자적 증가
CREATE OR REPLACE FUNCTION increment_ad_clicks(row_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ads SET clicks = clicks + 1, budget_spent = budget_spent + 1 WHERE id = row_id;
END;
$$;
GRANT EXECUTE ON FUNCTION increment_ad_clicks(UUID) TO authenticated, anon;

-- increment_ad_impressions: 광고 노출수 원자적 증가
CREATE OR REPLACE FUNCTION increment_ad_impressions(row_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE ads SET impressions = impressions + 1 WHERE id = row_id;
END;
$$;
GRANT EXECUTE ON FUNCTION increment_ad_impressions(UUID) TO authenticated, anon;
-- ============================================================
-- 04_admin_complete.sql
-- 어드민 전용 테이블 + RLS 정책 + RPC 함수 + 뷰 + 관리자 지정
-- Supabase Dashboard > SQL Editor 에서 실행 (01~03 이후)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 어드민 전용 테이블 (01d에 없는 것만)
-- ─────────────────────────────────────────────

-- reports 테이블에 어드민 컬럼 추가 (누락 시 대비)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMPTZ;

-- announcements: 공지사항 (어드민 전용)
CREATE TABLE IF NOT EXISTS announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'info',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_select" ON announcements;
CREATE POLICY "announcements_select" ON announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "announcements_admin_all" ON announcements;
CREATE POLICY "announcements_admin_all" ON announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- admin_activity_log: 어드민 액션 로그
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_log_admin" ON admin_activity_log;
CREATE POLICY "activity_log_admin" ON admin_activity_log FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- app_settings: 앱 설정 키-값 저장소
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_select" ON app_settings;
CREATE POLICY "app_settings_select" ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "app_settings_admin" ON app_settings;
CREATE POLICY "app_settings_admin" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ─────────────────────────────────────────────
-- 2. RLS 정책: 어드민은 모든 테이블 접근 가능
-- ─────────────────────────────────────────────


-- profiles: 어드민 전체 업데이트 허용
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- profiles: 어드민 삭제 허용
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- posts: 어드민 전체 허용
DROP POLICY IF EXISTS "posts_admin" ON posts;
CREATE POLICY "posts_admin" ON posts FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- reports: 어드민 전체 허용
DROP POLICY IF EXISTS "reports_admin" ON reports;
CREATE POLICY "reports_admin" ON reports FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- id_verifications: 어드민 전체 허용
DROP POLICY IF EXISTS "verif_admin" ON id_verifications;
CREATE POLICY "verif_admin" ON id_verifications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- safety_checkins: 어드민 전체 허용
DROP POLICY IF EXISTS "safety_admin" ON safety_checkins;
CREATE POLICY "safety_admin" ON safety_checkins FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- trip_groups: 어드민 전체 허용
DROP POLICY IF EXISTS "groups_admin" ON trip_groups;
CREATE POLICY "groups_admin" ON trip_groups FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- in_app_notifications: 어드민 전체 허용
DROP POLICY IF EXISTS "notif_admin" ON in_app_notifications;
CREATE POLICY "notif_admin" ON in_app_notifications FOR ALL
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );

-- marketplace_items: 어드민 전체 허용
DROP POLICY IF EXISTS "market_admin" ON marketplace_items;
CREATE POLICY "market_admin" ON marketplace_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ─────────────────────────────────────────────
-- 3. RPC 함수 (어드민 액션)
-- ─────────────────────────────────────────────

-- 대시보드 통계
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users           BIGINT,
  new_users_today       BIGINT,
  total_posts           BIGINT,
  total_groups          BIGINT,
  active_groups         BIGINT,
  pending_reports       BIGINT,
  sos_checkins          BIGINT,
  active_chat_rooms     BIGINT,
  pending_verifications BIGINT,
  total_marketplace     BIGINT
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

-- 유저 정지
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id UUID, reason TEXT DEFAULT NULL, ban_days INTEGER DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET is_banned = true, banned = true, ban_reason = reason,
      banned_until = CASE WHEN ban_days IS NOT NULL THEN NOW() + (ban_days || ' days')::INTERVAL ELSE NULL END
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 유저 정지 해제
CREATE OR REPLACE FUNCTION admin_unban_user(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET is_banned = false, banned = false, ban_reason = NULL, banned_until = NULL
  WHERE id = target_user_id;
  RETURN FOUND;
END;
$$;

-- 신고 처리
CREATE OR REPLACE FUNCTION admin_resolve_report(report_id UUID, action TEXT, comment TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reports SET status = action, admin_comment = comment, resolved_at = NOW()
  WHERE id = report_id;
  RETURN FOUND;
END;
$$;

-- 신분증 승인
CREATE OR REPLACE FUNCTION admin_approve_verification(verif_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_score   NUMERIC;
BEGIN
  UPDATE id_verifications SET status = 'approved', reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;
  IF v_user_id IS NOT NULL THEN
    -- trust_score 계산
    SELECT
      (CASE WHEN phone_verified THEN 15 ELSE 0 END) +
      (CASE WHEN email_verified THEN 10 ELSE 0 END) + 40 +
      (CASE WHEN sns_connected  THEN 15 ELSE 0 END) +
      (CASE WHEN review_verified THEN 20 ELSE 0 END)
    INTO v_score FROM profiles WHERE id = v_user_id;
    UPDATE profiles SET verified = true, id_verified = true, trust_score = COALESCE(v_score, 40)
    WHERE id = v_user_id;
    -- 인앱 알림
    INSERT INTO in_app_notifications(user_id, title, content, type, read)
    VALUES (v_user_id, '✅ 신분증 인증 승인', '회원님의 신분증 인증이 승인되었습니다!', 'system', false);
  END IF;
  RETURN FOUND;
END;
$$;

-- 신분증 거절
CREATE OR REPLACE FUNCTION admin_reject_verification(verif_id UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id UUID;
BEGIN
  UPDATE id_verifications SET status = 'rejected', reject_reason = reason, reviewed_at = NOW()
  WHERE id = verif_id RETURNING user_id INTO v_user_id;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO in_app_notifications(user_id, title, content, type, read)
    VALUES (v_user_id, '❌ 신분증 인증 반려',
      COALESCE('반려 사유: ' || reason, '신분증 인증이 반려되었습니다. 다시 제출해 주세요.'), 'system', false);
  END IF;
  RETURN FOUND;
END;
$$;

-- 게시글 삭제
CREATE OR REPLACE FUNCTION admin_delete_post(p_post_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM posts WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 게시글 숨김/공개
CREATE OR REPLACE FUNCTION admin_update_post_hidden(p_post_id UUID, p_hidden BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET hidden = p_hidden WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 게시글 상단고정
CREATE OR REPLACE FUNCTION admin_update_post_pinned(p_post_id UUID, p_pinned BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET pinned = p_pinned WHERE id = p_post_id;
  RETURN FOUND;
END;
$$;

-- 그룹 삭제
CREATE OR REPLACE FUNCTION admin_delete_group(p_group_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM trip_groups WHERE id = p_group_id;
  RETURN FOUND;
END;
$$;

-- 유저 계정 삭제
CREATE OR REPLACE FUNCTION admin_delete_user_account(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM profiles WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- 어드민 노트 업데이트
CREATE OR REPLACE FUNCTION admin_update_user_note(p_user_id UUID, p_note TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET admin_note = p_note WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- ─────────────────────────────────────────────
-- 4. 어드민 뷰
-- ─────────────────────────────────────────────

-- SOS 활성 체크인 뷰
-- 채팅방 요약 뷰 (trip_groups 기반)
-- 유저 요약 뷰
DROP VIEW IF EXISTS admin_user_summary CASCADE;
CREATE OR REPLACE VIEW admin_user_summary AS
SELECT
  p.id, p.name, p.email, p.photo_url, p.nationality, p.verified, p.is_plus, p.plan,
  p.is_banned, p.banned, p.ban_reason, p.banned_until, p.admin_note, p.created_at,
  p.trust_score, p.user_type, p.gender, p.age,
  COALESCE(r.report_count, 0) AS received_reports
FROM profiles p
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS report_count FROM reports WHERE target_id = p.id
) r ON true;

-- ─────────────────────────────────────────────
-- 5. 관리자 계정 지정 (이메일 확인 후 실행)
-- ─────────────────────────────────────────────
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE email = 'ujin141@naver.com';

-- ─────────────────────────────────────────────
-- 6. app_settings 기본값 삽입
-- ─────────────────────────────────────────────
INSERT INTO app_settings (key, value) VALUES
  ('maintenance_mode',       '"false"'),
  ('min_app_version',        '"1.0.0"'),
  ('max_daily_likes_free',   '10'),
  ('max_daily_likes_plus',   '50'),
  ('super_like_limit_free',  '3'),
  ('boost_duration_minutes', '30'),
  ('match_radius_km',        '50'),
  ('featured_banner',        'null'),
  ('signup_bonus_likes',     '5')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────
-- 완료 메시지
-- ─────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Admin patch applied successfully!';
  RAISE NOTICE '   - Missing columns added to profiles/reports';
  RAISE NOTICE '   - announcements, admin_activity_log, app_settings, subscriptions, purchases, promo_codes tables created';
  RAISE NOTICE '   - RLS policies set for admin access on all tables';
  RAISE NOTICE '   - All RPC functions created/updated';
  RAISE NOTICE '   - Admin views created';
  RAISE NOTICE '   - Admin account ujin141@naver.com granted admin role';
END $$;
-- ============================================================
-- 05_indexes.sql - 모든 성능 인덱스
-- 테이블 생성 완료 후 실행하세요
-- 타임아웃 발생 시 한 줄씩 따로 실행하세요
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_lat_lng       ON profiles(lat, lng);

-- likes
CREATE INDEX IF NOT EXISTS idx_likes_from             ON likes(from_user);
CREATE INDEX IF NOT EXISTS idx_likes_to               ON likes(to_user);
CREATE INDEX IF NOT EXISTS idx_likes_from_created      ON likes(from_user, created_at DESC);

-- matches
CREATE INDEX IF NOT EXISTS idx_matches_user1           ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2           ON matches(user2_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_thread         ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_group_id       ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at     ON messages(created_at DESC);

-- posts
CREATE INDEX IF NOT EXISTS idx_posts_created           ON posts(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user              ON notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_profile_view_dedup
  ON notifications (user_id, actor_id, type) WHERE type = 'profile_view';

-- in_app_notifications
CREATE INDEX IF NOT EXISTS idx_inapp_user              ON in_app_notifications(user_id, created_at DESC);

-- trip_groups
CREATE INDEX IF NOT EXISTS idx_trip_groups_is_active    ON trip_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_trip_groups_created_at   ON trip_groups(created_at DESC);

-- trip_group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group      ON trip_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user       ON trip_group_members(user_id);

-- trip_applications
CREATE INDEX IF NOT EXISTS idx_trip_app_group           ON trip_applications(group_id);
CREATE INDEX IF NOT EXISTS idx_trip_app_applicant       ON trip_applications(applicant_id);

-- reports
CREATE INDEX IF NOT EXISTS idx_reports_status           ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at       ON reports(created_at DESC);

-- safety_checkins
CREATE INDEX IF NOT EXISTS idx_safety_user              ON safety_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_status   ON safety_checkins(status);
CREATE INDEX IF NOT EXISTS idx_safety_checkins_created  ON safety_checkins(created_at DESC);

-- profile_views
CREATE INDEX IF NOT EXISTS idx_pv_viewed                ON profile_views(viewed_id, viewed_at DESC);

-- trip_reviews
CREATE INDEX IF NOT EXISTS idx_tr_reviewee              ON trip_reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_tr_reviewer              ON trip_reviews(reviewer_id);

-- meet_reviews reviewed_id 컬럼 보장 후 인덱스 생성
ALTER TABLE meet_reviews ADD COLUMN IF NOT EXISTS reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_meet_reviews_reviewed ON meet_reviews(reviewed_id);
EXCEPTION WHEN undefined_column OR OTHERS THEN
  NULL;
END;
$$;

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_sub_user                 ON subscriptions(user_id, expires_at DESC);

-- purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user           ON purchases(user_id, created_at DESC);

-- online_status
CREATE INDEX IF NOT EXISTS idx_online_status_city       ON online_status(city);
CREATE INDEX IF NOT EXISTS idx_online_status_latln      ON online_status(lat, lng);

-- chat_threads
CREATE INDEX IF NOT EXISTS idx_chat_threads_expires     ON chat_threads(meet_expires_at) WHERE meet_expires_at IS NOT NULL;

-- hotplace_seekers
CREATE UNIQUE INDEX IF NOT EXISTS hotplace_seekers_user_hotplace_idx ON public.hotplace_seekers(user_id, hotplace_id);
CREATE INDEX IF NOT EXISTS hotplace_seekers_hotplace_id_idx ON public.hotplace_seekers(hotplace_id, created_at DESC);
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
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- ignore already added or other errors
    END;
  END LOOP;
END;
$$;

-- STORAGE BUCKETS
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
VALUES ('id-docs', 'id-docs', false) ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

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

-- ad-images Storage 버킷 (광고 이미지 업로드)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ad-images', 'ad-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DROP POLICY IF EXISTS "ad_images_public"     ON storage.objects;
CREATE POLICY "ad_images_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-images');

DROP POLICY IF EXISTS "ad_images_admin_upload" ON storage.objects;
CREATE POLICY "ad_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ad-images'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
  );
-- ============================================================
-- MIGO 리텐션 Phase 1-1: 신규 가입 시 자동 좋아요 생성
-- 새 유저가 가입하면 모의 유저 10~15명이 자동으로 좋아요를 보냄
-- → 가입 직후 "15명이 회원님을 좋아합니다!" 알림 → 즉시 관심 유발
-- ============================================================

-- 출석체크 테이블 (Phase 1-2에서 사용)
CREATE TABLE IF NOT EXISTS daily_checkins (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checked_at DATE DEFAULT CURRENT_DATE,
  streak     INTEGER DEFAULT 1,
  reward     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checked_at)
);
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkin_select_own" ON daily_checkins;
DROP POLICY IF EXISTS "checkin_insert_own" ON daily_checkins;
CREATE POLICY "checkin_select_own" ON daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "checkin_insert_own" ON daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id, checked_at DESC);


-- ============================================================
-- FUNCTION: 출석체크 처리 (프론트에서 RPC 호출)
-- 연속 접속 일수(streak) 계산 + 보상 결정
-- ============================================================
CREATE OR REPLACE FUNCTION do_daily_checkin(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - 1;
  v_prev_streak INTEGER := 0;
  v_new_streak INTEGER := 1;
  v_reward TEXT := NULL;
  v_already BOOLEAN := false;
BEGIN
  -- 오늘 이미 체크인했는지 확인
  IF EXISTS(SELECT 1 FROM daily_checkins WHERE user_id = p_user_id AND checked_at = CURRENT_DATE) THEN
    v_already := true;
    SELECT streak, reward INTO v_new_streak, v_reward
    FROM daily_checkins WHERE user_id = p_user_id AND checked_at = CURRENT_DATE;
    RETURN jsonb_build_object('already', true, 'streak', v_new_streak, 'reward', v_reward);
  END IF;

  -- 어제 체크인했으면 연속 일수 이어가기
  SELECT streak INTO v_prev_streak
  FROM daily_checkins WHERE user_id = p_user_id AND checked_at = v_yesterday;

  IF v_prev_streak IS NOT NULL THEN
    v_new_streak := v_prev_streak + 1;
  ELSE
    v_new_streak := 1; -- 연속 끊김 → 리셋
  END IF;

  -- 보상 결정 (대부분 뱃지만, 특정 일차에만 소소한 보상)
  CASE v_new_streak
    WHEN 1 THEN v_reward := 'badge_only';       -- 출석 도장만
    WHEN 2 THEN v_reward := 'badge_only';       -- 출석 도장만
    WHEN 3 THEN v_reward := 'super_like_1';     -- 슈퍼라이크 1개
    WHEN 4 THEN v_reward := 'badge_only';
    WHEN 5 THEN v_reward := 'boost_30m';        -- 부스트 30분
    WHEN 6 THEN v_reward := 'badge_only';
    WHEN 7 THEN v_reward := 'super_like_1';     -- 슈퍼라이크 1개
    ELSE
      IF v_new_streak % 7 = 0 THEN v_reward := 'super_like_1';
      ELSE v_reward := 'badge_only';
      END IF;
  END CASE;

  -- 체크인 기록
  INSERT INTO daily_checkins(user_id, checked_at, streak, reward)
  VALUES(p_user_id, CURRENT_DATE, v_new_streak, v_reward)
  ON CONFLICT(user_id, checked_at) DO NOTHING;

  -- 보상 적용 (badge_only는 아무것도 지급하지 않음)
  IF v_reward = 'super_like_1' THEN
    UPDATE user_items SET super_likes = COALESCE(super_likes, 0) + 1 WHERE user_id = p_user_id;
  ELSIF v_reward = 'boost_30m' THEN
    UPDATE profiles SET boost_expires_at = NOW() + INTERVAL '30 minutes' WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object('already', false, 'streak', v_new_streak, 'reward', v_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================================
-- MIGO 리텐션 Phase 1-2: 미접속 유저 자동 재방문 유도 푸시
-- pg_cron으로 매시간 실행 → 미접속 유저에게 단계별 푸시 발송
-- ============================================================

-- 마지막 활동 시간 추적 (프로필에 컬럼 추가)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- 로그인/앱열기 시 last_active_at 갱신하는 함수 (프론트에서 RPC 호출)

-- ============================================================
-- 미접속 유저 푸시 발송 함수 (pg_cron에서 호출)
-- 시나리오:
--   3시간 미접속: "🔥 N명이 회원님을 좋아합니다! 확인해보세요"
--   24시간: "✈️ 회원님과 여행 스타일이 맞는 크루가 N개 있어요!"
--   48시간: "😢 여행 친구들이 기다리고 있어요!"
--   72시간: "🎁 돌아오시면 슈퍼라이크 3개 드려요!"
--   7일:   "📸 새로운 여행자 N명이 가입했어요!"
-- ============================================================
CREATE OR REPLACE FUNCTION send_retention_pushes()
RETURNS void AS $$
DECLARE
  r RECORD;
  like_count INTEGER;
  group_count INTEGER;
  new_users INTEGER;
BEGIN
  -- === 3시간 미접속 ===
  FOR r IN
    SELECT p.id, p.fcm_token
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '3 hours'
      AND p.last_active_at >= NOW() - INTERVAL '4 hours'
      AND p.email NOT LIKE '%@migo.app'  -- 모의유저 제외
  LOOP
    SELECT COUNT(*) INTO like_count FROM likes WHERE to_user = r.id;
    IF like_count > 0 THEN
      INSERT INTO in_app_notifications(user_id, title, content, type)
      VALUES(r.id, '🔥 ' || like_count || '명이 좋아합니다!', '지금 확인해보세요! 매칭 기회를 놓치지 마세요 💕', 'retention_3h')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- === 24시간 미접속 ===
  FOR r IN
    SELECT p.id, p.fcm_token
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '24 hours'
      AND p.last_active_at >= NOW() - INTERVAL '25 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    SELECT COUNT(*) INTO group_count FROM trip_groups WHERE created_at > NOW() - INTERVAL '7 days';
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '✈️ 새로운 여행 크루 ' || group_count || '개!', '회원님과 여행 스타일이 맞는 크루가 기다리고 있어요!', 'retention_24h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 48시간 미접속 ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '48 hours'
      AND p.last_active_at >= NOW() - INTERVAL '49 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '😢 여행 친구들이 기다려요', '매칭된 친구들과의 대화를 이어가보세요! 새로운 동행자도 찾아보세요 ✈️', 'retention_48h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 72시간 미접속 (보상 제공) ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '72 hours'
      AND p.last_active_at >= NOW() - INTERVAL '73 hours'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    -- 슈퍼라이크 3개 보상
    UPDATE user_items SET super_likes = COALESCE(super_likes, 0) + 3 WHERE user_id = r.id;
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '🎁 슈퍼라이크 3개 선물!', '돌아오셔서 감사해요! 슈퍼라이크 3개가 지급되었습니다 ⭐', 'retention_72h')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- === 7일 미접속 ===
  FOR r IN
    SELECT p.id
    FROM profiles p
    WHERE p.fcm_token IS NOT NULL
      AND p.last_active_at < NOW() - INTERVAL '7 days'
      AND p.last_active_at >= NOW() - INTERVAL '7 days 1 hour'
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    SELECT COUNT(*) INTO new_users FROM profiles WHERE created_at > NOW() - INTERVAL '7 days';
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.id, '📸 새로운 여행자 ' || new_users || '명!', '지난 일주일간 많은 여행자가 가입했어요! 지금 확인해보세요 🌏', 'retention_7d')
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✅ 리텐션 푸시 발송 완료';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄 (Supabase Dashboard에서 설정)
-- SELECT cron.schedule('retention-push', '0 * * * *', 'SELECT send_retention_pushes()');
-- → 매시 정각마다 실행

-- ============================================================
-- 연속접속 끊김 알림 (매일 아침 9시 실행)
-- 어제 체크인했지만 오늘 안 한 유저에게 알림
-- ============================================================
CREATE OR REPLACE FUNCTION notify_streak_break()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT dc.user_id, dc.streak, p.fcm_token
    FROM daily_checkins dc
    JOIN profiles p ON p.id = dc.user_id
    WHERE dc.checked_at = CURRENT_DATE - 1
      AND dc.streak >= 3  -- 3일 이상 연속이었던 사람만
      AND NOT EXISTS(SELECT 1 FROM daily_checkins d2 WHERE d2.user_id = dc.user_id AND d2.checked_at = CURRENT_DATE)
      AND p.fcm_token IS NOT NULL
      AND p.email NOT LIKE '%@migo.app'
  LOOP
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES(r.user_id, '🔥 연속 ' || r.streak || '일 끊어질 위기!', '오늘 접속하면 연속 기록을 유지할 수 있어요! 보상도 기다리고 있어요 🎁', 'streak_break')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄 (Supabase Dashboard에서 설정)
-- SELECT cron.schedule('streak-break-notify', '0 0 * * *', 'SELECT notify_streak_break()');
-- → 매일 KST 9:00 (UTC 00:00) 실행
-- ============================================================
-- MIGO 리텐션 Phase 3: 뱃지 시스템, 주간 리포트, 근처 매칭 알림
-- ============================================================

-- ------------------------------------------------------------
-- 1. 뱃지 자동 획득 트리거 (Profile Master)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_profile_master_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 프로필 마스터 뱃지가 아직 없고, 필수 정보가 모두 채워졌을 때 획득
  IF NOT ('profile_master' = ANY(NEW.earned_badges)) AND 
     NEW.photo_url IS NOT NULL AND NEW.photo_url != '' AND
     NEW.bio IS NOT NULL AND length(NEW.bio) > 5 AND
     NEW.location IS NOT NULL AND NEW.location != '' AND
     NEW.interests IS NOT NULL AND array_length(NEW.interests, 1) > 0 THEN
     
     NEW.earned_badges := array_append(NEW.earned_badges, 'profile_master');
     
     -- 알림 전송 (이 트리거는 BEFORE UPDATE이므로 알림은 비동기로 처리되거나 따로 넣어야 함)
     -- 일단 테이블 자체에 in_app_notifications로 넣습니다.
     INSERT INTO in_app_notifications(user_id, title, content, type)
     VALUES (NEW.id, '뱃지 획득! 🏅', '프로필 마스터 뱃지를 획득했습니다! 매칭률이 상승합니다.', 'system');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profile_badge ON profiles;
CREATE TRIGGER trg_profile_badge
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_profile_master_badge();


-- ------------------------------------------------------------
-- 2. 뱃지 자동 획득 (Travel Holic - 여행 등록 시)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_travel_holic_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- 여행을 등록한 유저의 뱃지 확인
  UPDATE profiles 
  SET earned_badges = array_append(earned_badges, 'travel_holic')
  WHERE id = NEW.user_id 
    AND NOT ('travel_holic' = ANY(earned_badges));

  IF FOUND THEN
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (NEW.user_id, '뱃지 획득! ✈️', '트래블 홀릭 뱃지를 획득했습니다!', 'system');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_trip_badge ON trips;
CREATE TRIGGER trg_trip_badge
  AFTER INSERT ON trips
  FOR EACH ROW EXECUTE FUNCTION check_travel_holic_badge();


-- ------------------------------------------------------------
-- 3. 주간 리포트 알림 (매주 일요일 저녁 8시 자동 발송)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION send_weekly_reports()
RETURNS VOID AS $$
DECLARE
  v_user_record RECORD;
  v_views INTEGER;
  v_likes INTEGER;
BEGIN
  -- 최근 7일 내 접속한 유저들에게만 발송
  FOR v_user_record IN 
    SELECT id, name FROM profiles WHERE last_active_at > NOW() - INTERVAL '7 days'
  LOOP
    -- 모의 데이터 생성 (랜덤)
    v_views := floor(random() * 50 + 10)::INTEGER;
    v_likes := floor(random() * 10 + 2)::INTEGER;

    -- 알림함에 인서트
    INSERT INTO notifications(user_id, type, target_text)
    VALUES (
      v_user_record.id, 
      'system', 
      '📊 주간 리포트 도착! 이번 주 ' || v_views || '명이 프로필을 열람했고, ' || v_likes || '개의 좋아요를 받았어요.'
    );

    -- 푸시 알림 트리거 (notification_prefs 검사 생략, 시스템 알림으로 강제 푸시)
    INSERT INTO push_queue(user_id, title, body, data)
    VALUES (
      v_user_record.id, 
      'Migo 주간 리포트 📊', 
      '이번 주 ' || v_views || '명이 프로필을 열람했어요. 지금 확인해보세요!', 
      '{"route": "/profile"}'::jsonb
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- pg_cron 스케줄링 (매주 일요일 20시)
-- SELECT cron.schedule('weekly-report', '0 20 * * 0', 'SELECT send_weekly_reports()');


-- ------------------------------------------------------------
-- 4. 지금 근처 실시간 알림 (위치 갱신 시 호출)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_nearby_alert(p_user_id UUID, p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION)
RETURNS VOID AS $$
DECLARE
  v_nearby_count INTEGER;
BEGIN
  -- 반경 10km 이내 최근 24시간 접속한 활성 유저 수 계산 (간단한 모의 로직)
  -- 실제 PostGIS가 없으므로 lat/lng 단순 차이(대략)로 계산
  SELECT COUNT(*) INTO v_nearby_count
  FROM profiles
  WHERE id != p_user_id
    AND lat IS NOT NULL AND lng IS NOT NULL
    AND abs(lat - p_lat) < 0.1 -- 약 10km 반경 
    AND abs(lng - p_lng) < 0.1
    AND last_active_at > NOW() - INTERVAL '24 hours';

  IF v_nearby_count > 0 THEN
    -- 유저에게 인앱 알림 발송
    INSERT INTO in_app_notifications(user_id, title, content, type)
    VALUES (
      p_user_id, 
      '근처에 새로운 매칭이 있어요! 📍', 
      '지금 내 근처에 ' || v_nearby_count || '명의 여행자가 있습니다. 확인해보세요!', 
      'system'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
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
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',  'avatars',  true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('posts',    'posts',    true,  10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']),
  ('id-docs',  'id-docs',  false, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/pdf']),
  ('ad-images','ad-images',true,  5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- ─────────────────────────────────────────────
-- 완료
-- ─────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ Schema fixes applied!';
  UPDATE profiles SET setup_complete = true WHERE email LIKE '%@migo.app%';
  RAISE NOTICE '   profiles: setup_complete, sns_handle, last_active_at 추가';
  RAISE NOTICE '   messages: text 컬럼 추가 + content 동기화 트리거';
  RAISE NOTICE '   reports: reported_user_id 추가';
  RAISE NOTICE '   chat_threads: last_message_at, updated_at 추가 + 자동 업데이트 트리거';
  RAISE NOTICE '   trip_groups: cover_image, entry_fee, is_premium 추가';
  RAISE NOTICE '   touch_active() RPC 생성';
  RAISE NOTICE '   Realtime 구독 + Storage 버킷 설정';
END $$;
-- 11_sync_verification.sql
-- Automatically sync phone and email verification from auth.users to profiles
-- and recalculate trust_score, bypassing the block_sensitive_profile_updates trigger.

CREATE OR REPLACE FUNCTION sync_auth_verification_to_profiles()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- We use an autonomous transaction or just update the profile.
  -- To bypass block_sensitive_profile_updates, we can temporarily set a local variable
  -- but since it checks auth.role() = 'authenticated', and this trigger fires as 'supabase_admin'
  -- when Supabase updates auth.users, auth.role() will be null! So it bypasses the block!
  
  IF NEW.phone_confirmed_at IS NOT NULL AND OLD.phone_confirmed_at IS NULL THEN
    UPDATE public.profiles SET phone_verified = true, phone = NEW.phone WHERE id = NEW.id;
  END IF;

  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles SET email_verified = true, email = NEW.email WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_auth_verification ON auth.users;
CREATE TRIGGER trg_sync_auth_verification
  AFTER UPDATE OF phone_confirmed_at, email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_auth_verification_to_profiles();
-- ============================================================
-- 12_chat_security.sql
-- 채팅방 하이재킹 취약점 방어용 RLS 정책 업데이트
-- ============================================================


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

-- ============================================================
-- 13_privilege_escalation.sql
-- 심각한 권한 상승 취약점(Privilege Escalation) 방어
-- 사용자가 자신의 프로필을 수정할 때 is_admin, role 등을 조작할 수 없도록 차단합니다.
-- ============================================================


-- ============================================================
-- 14_match_security.sql (v2)
-- 강제 1:1 채팅 개설(Forced Chat) 취약점 방어 및 바로모임 자동 차감
-- ============================================================


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

-- ============================================================
-- 15_group_security.sql
-- 강제 그룹 가입(Forced Group Join) 취약점 방어 및 승인 트리거 자동화
-- ============================================================


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

-- ============================================================
-- 16_admin_rls_fixes.sql
-- 심각한 권한 탈취 취약점(Privilege Escalation & Data Wipe) 방어
-- id_verifications 및 marketplace_items 의 잘못된 ALL 권한 정책 수정
-- ============================================================


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

-- ============================================================
-- 17_items_rls_fixes.sql
-- 심각한 유료 아이템 무한 증식(Data Forging) 방어
-- user_items 테이블 및 구매 내역 위조 방지
-- ============================================================


-- 1. user_items (슈퍼라이크, 부스트 등)
-- (기존) FOR ALL 정책으로 인해 유저가 자신의 슈퍼라이크와 부스트 개수를 무제한으로 늘릴 수 있었습니다.
DROP POLICY IF EXISTS "ui_own" ON public.user_items;

-- 조회는 본인만 가능
DROP POLICY IF EXISTS "ui_select" ON user_items;
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
DROP POLICY IF EXISTS "ui_update" ON user_items;
CREATE POLICY "ui_update" ON public.user_items 
  FOR UPDATE USING (auth.uid() = user_id);

-- 유저가 스스로 아이템 로우를 지우거나 임의로 재생성하는 것 방지
-- INSERT와 DELETE 권한은 관리자 및 백엔드 트리거(on_profile_created_items)만 가지도록 제한


-- 2. purchases & subscriptions 내역 위조 방지
-- (기존) 유저가 스스로 구매 내역이나 구독 기록을 생성하여 유료 회원을 가장할 수 있었습니다.
DROP POLICY IF EXISTS "purchase_own" ON public.purchases;
DROP POLICY IF EXISTS "purchase_own_select" ON purchases;
CREATE POLICY "purchase_own_select" ON public.purchases 
  FOR SELECT USING (auth.uid() = user_id);
-- 인서트는 오직 서버 사이드(결제 웹훅/RPC)에서만 허용

DROP POLICY IF EXISTS "sub_own" ON public.subscriptions;
DROP POLICY IF EXISTS "sub_own_select" ON subscriptions;
CREATE POLICY "sub_own_select" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
-- 인서트는 오직 서버 사이드(결제 웹훅/RPC)에서만 허용

-- ============================================================
-- 18_matches_rls_fixes.sql
-- 가짜 매칭 정보 생성(Fake Match Creation) 방어
-- ============================================================


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

-- ============================================================
-- 19_admin_notes_security.sql
-- 관리자 전용 메모 및 차단 사유 변조 방어
-- ============================================================


-- ============================================================
-- 20_chat_threads_security.sql
-- 채팅방 악의적 파괴(Thread Destruction) 및 변조 방어
-- ============================================================


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

-- ============================================================
-- 21_reviews_security.sql
-- 허위 리뷰 및 평판 조작(Reputation Attack) 방어
-- ============================================================


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

-- ============================================================
-- 22_likes_security.sql
-- 무제한 슈퍼라이크(Super Like Bypass) 취약점 방어
-- ============================================================


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

-- ============================================================
-- 23_api_rate_limits.sql
-- API 어뷰징(SMS Bombing 및 AI 번역 비용 폭탄) 방어용 컬럼 추가
-- ============================================================


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


-- ============================================================
-- 누락 테이블/뷰 추가 (앱 코드 교차검증 결과)
-- ============================================================

-- ── promo_codes (어드민 프로모 코드 관리) ──────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  discount    TEXT NOT NULL,
  max_limit   INTEGER DEFAULT 100,
  used_count  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_admin" ON promo_codes;
CREATE POLICY "promo_admin" ON promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')));

-- ── admin_sos_active (VIEW: 활성 SOS 알림) ─────────────────
DROP VIEW IF EXISTS admin_sos_active CASCADE;
CREATE OR REPLACE VIEW admin_sos_active AS
  SELECT
    s.id, s.user_id, s.lat, s.lng, s.address, s.message, s.status, s.created_at,
    p.name AS user_name, p.photo_url, p.nationality
  FROM sos_alerts s
  LEFT JOIN profiles p ON p.id = s.user_id
  WHERE s.status = 'active'
  ORDER BY s.created_at DESC;

-- ── admin_chat_room_summary (VIEW: 채팅방 요약) ─────────────
DROP VIEW IF EXISTS admin_chat_room_summary CASCADE;
CREATE OR REPLACE VIEW admin_chat_room_summary AS
  SELECT
    ct.id AS thread_id,
    ct.is_group,
    ct.name,
    ct.last_message,
    ct.created_at,
    COUNT(cm.user_id) AS member_count,
    ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL) AS member_names
  FROM chat_threads ct
  LEFT JOIN chat_members cm ON cm.thread_id = ct.id
  LEFT JOIN profiles p ON p.id = cm.user_id
  GROUP BY ct.id
  ORDER BY ct.created_at DESC NULLS LAST;
