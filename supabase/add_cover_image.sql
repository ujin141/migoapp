ALTER TABLE trip_groups ADD COLUMN IF NOT EXISTS cover_image TEXT;

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
