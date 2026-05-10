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

-- meet_reviews (reviewed_id 컬럼 존재 시에만 실행)
-- CREATE INDEX IF NOT EXISTS idx_meet_reviews_reviewed    ON meet_reviews(reviewed_id);

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
