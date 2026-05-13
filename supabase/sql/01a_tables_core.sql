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
CREATE POLICY "likes_insert_own" ON likes FOR INSERT WITH CHECK (auth.uid() = from_user);
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
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);

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
CREATE POLICY "threads_delete" ON chat_threads FOR DELETE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);
CREATE POLICY "threads_update" ON chat_threads FOR UPDATE USING (
  EXISTS(SELECT 1 FROM chat_members WHERE chat_members.thread_id = id AND chat_members.user_id = auth.uid())
);

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

CREATE POLICY "members_select" ON chat_members FOR SELECT USING (
  check_is_chat_member(thread_id)
);
CREATE POLICY "members_insert" ON chat_members FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM chat_threads WHERE id = thread_id AND created_by = auth.uid())
  OR check_is_chat_member(thread_id)
);
