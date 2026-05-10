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
