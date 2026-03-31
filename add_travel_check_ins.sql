-- ============================================================
-- TABLE: travel_check_ins
-- ============================================================
CREATE TABLE IF NOT EXISTS travel_check_ins (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  city          TEXT,
  country       TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL
);

ALTER TABLE travel_check_ins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "travel_check_ins_select" ON travel_check_ins;
DROP POLICY IF EXISTS "travel_check_ins_upsert" ON travel_check_ins;
DROP POLICY IF EXISTS "travel_check_ins_delete" ON travel_check_ins;

CREATE POLICY "travel_check_ins_select" ON travel_check_ins FOR SELECT USING (true);
CREATE POLICY "travel_check_ins_upsert" ON travel_check_ins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "travel_check_ins_delete" ON travel_check_ins FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_travel_check_ins_city ON travel_check_ins(city);
CREATE INDEX IF NOT EXISTS idx_travel_check_ins_expires ON travel_check_ins(expires_at);
