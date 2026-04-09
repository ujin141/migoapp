-- ============================================================
-- MIGO 채팅 모의 데이터 (ujin141@naver.com 전용)
-- chat_threads + chat_members + messages 삽입
-- 모의 유저(mock.*.@migo.app)가 이미 profiles에 있어야 합니다
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

DO $$
DECLARE
  me    UUID;
  u1 UUID; u2 UUID; u3 UUID; u4 UUID; u5 UUID; u6 UUID;
  t1 UUID; t2 UUID; t3 UUID; t4 UUID; t5 UUID; t6 UUID;
BEGIN
  -- 내 계정 UUID
  SELECT id INTO me FROM auth.users WHERE email='ujin141@naver.com' LIMIT 1;
  IF me IS NULL THEN RAISE EXCEPTION '❌ ujin141@naver.com 계정 없음'; END IF;

  -- 상대방 UUID 조회
  SELECT id INTO u1 FROM auth.users WHERE email='mock.yujin@migo.app'  LIMIT 1;
  SELECT id INTO u2 FROM auth.users WHERE email='mock.kenji@migo.app'  LIMIT 1;
  SELECT id INTO u3 FROM auth.users WHERE email='mock.sofia@migo.app'  LIMIT 1;
  SELECT id INTO u4 FROM auth.users WHERE email='mock.lena@migo.app'   LIMIT 1;
  SELECT id INTO u5 FROM auth.users WHERE email='mock.yuna@migo.app'   LIMIT 1;
  SELECT id INTO u6 FROM auth.users WHERE email='mock.ahmed@migo.app'  LIMIT 1;

  IF u1 IS NULL THEN RAISE EXCEPTION '❌ 모의 유저가 없습니다. mock_data_insert.sql 먼저 실행하세요'; END IF;

  -- ─── 채팅 스레드 6개 생성 ───────────────────────────────────
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t1;
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t2;
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t3;
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t4;
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t5;
  INSERT INTO chat_threads(id, is_group) VALUES (gen_random_uuid(), false) RETURNING id INTO t6;

  -- ─── 채팅 멤버 등록 ─────────────────────────────────────────
  INSERT INTO chat_members(thread_id, user_id) VALUES
    (t1, me),(t1, u1),
    (t2, me),(t2, u2),
    (t3, me),(t3, u3),
    (t4, me),(t4, u4),
    (t5, me),(t5, u5),
    (t6, me),(t6, u6)
  ON CONFLICT DO NOTHING;

  -- ─── 메시지 삽입 ────────────────────────────────────────────
  -- 스레드 1: 이유진과 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t1, u1, '안녕하세요! 치앙마이 같이 여행 어떠세요? 😊', NOW() - INTERVAL '2 days'),
    (t1, me, '오 좋아요! 언제 출발 예정이에요?', NOW() - INTERVAL '2 days' + INTERVAL '5 minutes'),
    (t1, u1, '4월 5일 어떠세요? 카페 투어 계획 중이에요 ☕', NOW() - INTERVAL '2 days' + INTERVAL '8 minutes'),
    (t1, me, '완전 좋아요! 저도 카페 좋아해요', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
    (t1, u1, '그럼 여행 그룹에 참여해보세요!', NOW() - INTERVAL '1 day');

  -- 스레드 2: 타나카 켄지와 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t2, me, 'Hi Kenji! Are you joining the Bali surf trip?', NOW() - INTERVAL '3 days'),
    (t2, u2, 'Yes! I am going 🏄 Do you surf?', NOW() - INTERVAL '3 days' + INTERVAL '10 minutes'),
    (t2, me, 'Not yet but totally want to learn!', NOW() - INTERVAL '3 days' + INTERVAL '15 minutes'),
    (t2, u2, 'I can teach you the basics 😄 Let''s go together!', NOW() - INTERVAL '2 days'),
    (t2, me, '감사해요! 기대돼요 🤙', NOW() - INTERVAL '2 days' + INTERVAL '3 minutes');

  -- 스레드 3: 소피아 로페즈와 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t3, u3, 'Paris trip에 관심 있으신가요? 🗼', NOW() - INTERVAL '5 days'),
    (t3, me, '네! 파리는 항상 꿈이었어요', NOW() - INTERVAL '5 days' + INTERVAL '20 minutes'),
    (t3, u3, '미식 투어 같이 해요! 루브르도 갈 거예요 🏛️', NOW() - INTERVAL '4 days'),
    (t3, me, '너무 좋아요! 언제쯤 자세한 일정 알 수 있나요?', NOW() - INTERVAL '4 days' + INTERVAL '2 hours');

  -- 스레드 4: 레나 마르탱과 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t4, u4, 'Bonjour! Paris food tour에 오세요 🍷', NOW() - INTERVAL '6 hours'),
    (t4, me, '꼭 가고 싶어요! 미슐랭 레스토랑 예약 어려운가요?', NOW() - INTERVAL '5 hours'),
    (t4, u4, '제가 아는 곳 있어요. 같이 가면 자리 만들게요 😊', NOW() - INTERVAL '4 hours');

  -- 스레드 5: 박유나와 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t5, me, '오사카 맛집 헌팅 같이 해요! 🍜', NOW() - INTERVAL '1 hour'),
    (t5, u5, '완전요! 도톤보리 타코야키 알아요?', NOW() - INTERVAL '45 minutes'),
    (t5, me, '당연하죠! 쿠로몬 시장도 가고 싶어요', NOW() - INTERVAL '30 minutes'),
    (t5, u5, '좋아요~ 일정 공유해드릴게요 📅', NOW() - INTERVAL '10 minutes');

  -- 스레드 6: 아흐마드 칼릴과 대화
  INSERT INTO messages(thread_id, sender_id, text, created_at) VALUES
    (t6, u6, 'Hello! I saw your profile. Are you interested in history tours?', NOW() - INTERVAL '12 hours'),
    (t6, me, 'Yes! Egyptian history is so fascinating 🏺', NOW() - INTERVAL '11 hours'),
    (t6, u6, 'I can show you places tourists never find 😊', NOW() - INTERVAL '10 hours');

  RAISE NOTICE '✅ 채팅 완료! 스레드 6개, 메시지 22개 삽입됨';
END $$;