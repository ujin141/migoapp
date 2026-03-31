@echo off
REM ============================================================
REM Migo 백엔드 배포 스크립트 (Windows)
REM 이 파일을 더블클릭하거나 cmd에서 실행하세요
REM ============================================================

echo [1/4] Supabase CLI 확인 중...
where supabase >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo Supabase CLI가 없습니다. 설치 중...
  npm install -g supabase
)

echo [2/4] Supabase 로그인...
supabase login

echo [3/4] 프로젝트 연결 (Project ID: feeildpjwqfjlqimaxwr)...
supabase link --project-ref feeildpjwqfjlqimaxwr

echo [4/4] Edge Functions 배포 중...
supabase functions deploy twilio-send-otp --no-verify-jwt
supabase functions deploy twilio-verify-otp --no-verify-jwt

echo.
echo ============================================================
echo Edge Functions 배포 완료!
echo 다음 단계: Twilio 환경변수를 Supabase에 등록하세요
echo ============================================================
echo supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
echo supabase secrets set TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxx
echo supabase secrets set TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxx
echo ============================================================
pause
