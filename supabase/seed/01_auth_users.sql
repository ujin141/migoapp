-- MIGO Seed Part 1: Create 60 Auth Users
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  _emails TEXT[] := ARRAY[
    'seed_01@migo.app','seed_02@migo.app','seed_03@migo.app','seed_04@migo.app','seed_05@migo.app',
    'seed_06@migo.app','seed_07@migo.app','seed_08@migo.app','seed_09@migo.app','seed_10@migo.app',
    'seed_11@migo.app','seed_12@migo.app','seed_13@migo.app','seed_14@migo.app','seed_15@migo.app',
    'seed_16@migo.app','seed_17@migo.app','seed_18@migo.app','seed_19@migo.app','seed_20@migo.app',
    'seed_21@migo.app','seed_22@migo.app','seed_23@migo.app','seed_24@migo.app','seed_25@migo.app',
    'seed_26@migo.app','seed_27@migo.app','seed_28@migo.app','seed_29@migo.app','seed_30@migo.app',
    'seed_31@migo.app','seed_32@migo.app','seed_33@migo.app','seed_34@migo.app','seed_35@migo.app',
    'seed_36@migo.app','seed_37@migo.app','seed_38@migo.app','seed_39@migo.app','seed_40@migo.app',
    'seed_41@migo.app','seed_42@migo.app','seed_43@migo.app','seed_44@migo.app','seed_45@migo.app',
    'seed_46@migo.app','seed_47@migo.app','seed_48@migo.app','seed_49@migo.app','seed_50@migo.app',
    'seed_51@migo.app','seed_52@migo.app','seed_53@migo.app','seed_54@migo.app','seed_55@migo.app',
    'seed_56@migo.app','seed_57@migo.app','seed_58@migo.app','seed_59@migo.app','seed_60@migo.app'
  ];
  _e TEXT;
BEGIN
  FOREACH _e IN ARRAY _emails LOOP
    IF NOT EXISTS(SELECT 1 FROM auth.users WHERE email=_e) THEN
      INSERT INTO auth.users(id,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,aud,role,is_super_admin)
      VALUES(gen_random_uuid(),_e,'',NOW(),NOW(),NOW(),'{"provider":"email","providers":["email"]}','{}','authenticated','authenticated',false);
    END IF;
  END LOOP;
  RAISE NOTICE '✅ Part 1 완료: Auth 유저 60명 생성';
END $$;
