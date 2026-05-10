#!/bin/bash
# ============================================================
# Migo DB Schema - 한번에 실행 스크립트
# 사용법: ./run_schema.sh
# ============================================================

# Supabase 대시보드 > Settings > Database > Connection string (URI) 에서 복사
# 예: postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
DB_URL="${SUPABASE_DB_URL:-}"

if [ -z "$DB_URL" ]; then
  echo "❌ SUPABASE_DB_URL 환경변수를 설정해주세요."
  echo ""
  echo "사용법:"
  echo "  export SUPABASE_DB_URL='postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'"
  echo "  ./run_schema.sh"
  echo ""
  echo "또는 한줄로:"
  echo "  SUPABASE_DB_URL='postgresql://...' ./run_schema.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_DIR="$SCRIPT_DIR"

FILES=(
  "01a_tables_core.sql"
  "01b_tables_community.sql"
  "01c_tables_trips.sql"
  "01d_tables_misc.sql"
  "02_triggers.sql"
  "03_rpc_functions.sql"
  "04_admin.sql"
  "05_indexes.sql"
  "06_realtime_storage.sql"
)

echo "🚀 Migo DB Schema 적용 시작..."
echo ""

for f in "${FILES[@]}"; do
  filepath="$SQL_DIR/$f"
  if [ ! -f "$filepath" ]; then
    echo "⚠️  $f 파일을 찾을 수 없습니다. 건너뜁니다."
    continue
  fi
  echo -n "▶ $f 실행 중... "
  if psql "$DB_URL" -f "$filepath" --set ON_ERROR_STOP=1 -q 2>&1; then
    echo "✅ 완료"
  else
    echo "❌ 실패"
    echo "   위 에러를 확인하고 수정 후 다시 실행하세요."
    exit 1
  fi
done

echo ""
echo "🎉 모든 스키마가 성공적으로 적용되었습니다!"
