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
CREATE POLICY "idv_admin"      ON id_verifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
CREATE POLICY "marketplace_admin"  ON marketplace_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

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
