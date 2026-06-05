-- ── 1. profiles 테이블 컬럼 추가 ──────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- ── 2. referrals 매핑 테이블 생성 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책 설정 (일반 조회 가능하도록 최소한의 설정)
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_read_policy" ON referrals FOR SELECT TO authenticated USING (true);

-- ── 3. 자동 추천 코드 생성 트리거 함수 정의 ───────────────────────
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  done BOOL;
BEGIN
  -- 신규 생성 시에만 적용
  IF NEW.referral_code IS NULL THEN
    done := false;
    WHILE NOT done LOOP
      -- MIGO-XXXXXX 형식 (6자리 난수)
      new_code := 'MIGO-' || upper(substring(md5(random()::text) from 1 for 6));
      
      -- 중복 확인
      SELECT count(*) = 0 INTO done FROM profiles WHERE referral_code = new_code;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 바인딩 (프로필 INSERT 직전)
CREATE OR REPLACE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- ── 4. 기존 유저 추천 코드 일괄 발급 (Backfill) ─────────────────────
UPDATE profiles
SET referral_code = 'MIGO-' || upper(substring(md5(random()::text || id::text) from 1 for 6))
WHERE referral_code IS NULL;

-- ── 5. process_referral RPC 함수 정의 (보상 트랜잭션) ──────────────
CREATE OR REPLACE FUNCTION process_referral(
  p_referred_id UUID,
  p_referral_code TEXT
) RETURNS TEXT AS $$
DECLARE
  v_referrer_id UUID;
  v_referrer_name TEXT;
  v_already_referred UUID;
BEGIN
  -- 1) 입력한 추천 코드로 추천인(초대한 사람) 찾기
  SELECT id, name INTO v_referrer_id, v_referrer_name 
  FROM profiles 
  WHERE referral_code = upper(trim(p_referral_code));

  -- 추천인이 존재하지 않으면 예외 발생
  IF v_referrer_id IS NULL THEN
    RAISE EXCEPTION 'invalid_referral_code';
  END IF;

  -- 2) 자기 자신을 추천할 수 없음
  IF v_referrer_id = p_referred_id THEN
    RAISE EXCEPTION 'cannot_refer_self';
  END IF;

  -- 3) 이미 추천인을 등록한 사용자인지 확인
  SELECT referred_by INTO v_already_referred 
  FROM profiles 
  WHERE id = p_referred_id;

  IF v_already_referred IS NOT NULL THEN
    RAISE EXCEPTION 'already_referred';
  END IF;

  -- 4) profiles 테이블에 추천인 업데이트
  UPDATE profiles 
  SET referred_by = v_referrer_id 
  WHERE id = p_referred_id;

  -- 5) referrals 히스토리 기록
  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (v_referrer_id, p_referred_id);

  -- 6) 양쪽 모두에게 보상 지급 (각각 슈퍼라이크 3개씩)
  -- 초대한 사람 보상 (+3 Super Likes)
  PERFORM increment_user_items(v_referrer_id, 0, 3);
  
  -- 초대받아 가입한 사람 보상 (+3 Super Likes)
  PERFORM increment_user_items(p_referred_id, 0, 3);

  -- 추천인의 이름을 반환
  RETURN v_referrer_name;
END;
$$ LANGUAGE plpgsql;
