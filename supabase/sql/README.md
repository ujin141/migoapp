# Migo Database Schema

## 방법 1: 스크립트로 한번에 실행 (추천)

터미널에서 아래 명령어를 실행하세요:

```bash
# 1. Supabase 대시보드 > Settings > Database > Connection string (URI) 복사
# 2. 아래처럼 실행
SUPABASE_DB_URL='postgresql://postgres.xxxxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres' ./run_schema.sh
```

psql이 없으면: `brew install libpq && brew link --force libpq`

## 방법 2: SQL Editor에서 수동 실행

| 순서 | 파일명 | 내용 |
|------|--------|------|
| 1 | 01a_tables_core.sql | profiles, likes, matches, chat |
| 2 | 01b_tables_community.sql | messages, notifications, posts |
| 3 | 01c_tables_trips.sql | trips, reports, marketplace, reviews |
| 4 | 01d_tables_misc.sql | calendar, safety, purchases 등 |
| 5 | 02_triggers.sql | 트리거 + 자동화 함수 |
| 6 | 03_rpc_functions.sql | RPC 함수 |
| 7 | 04_admin.sql | 어드민 함수 + 뷰 |
| 8 | 05_indexes.sql | 성능 인덱스 |
| 9 | 06_realtime_storage.sql | Realtime + Storage |
