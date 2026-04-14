#!/bin/bash
# ══════════════════════════════════════════════════════════════════
#  Migo Android 릴리즈 빌드 스크립트
#  → Google Play Store 제출용 AAB 생성
#
#  사전 요구사항:
#  1. Android Studio / SDK 설치
#  2. JAVA_HOME 환경변수 설정
#  3. android/key.properties 파일 존재 (서명 키 정보)
#  4. google-services.json → android/app/ 에 위치
#
#  사용법:
#    chmod +x build_android.sh && ./build_android.sh
# ══════════════════════════════════════════════════════════════════

set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Migo Android Release Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Vite 프로덕션 빌드 ─────────────────────────────────────────
echo ""
echo "📦 Step 1: Building web assets (Vite)..."
npm run build
echo "✅ Web build complete → dist/"

# ── 2. Capacitor 동기화 ───────────────────────────────────────────
echo ""
echo "🔄 Step 2: Syncing Capacitor assets to Android..."
npx cap sync android
echo "✅ Capacitor sync complete"

# ── 3. key.properties 체크 ───────────────────────────────────────
if [ ! -f "android/key.properties" ]; then
  echo ""
  echo "❌ Error: android/key.properties not found!"
  echo ""
  echo "Create it with:"
  echo "  storePassword=YOUR_STORE_PASSWORD"
  echo "  keyPassword=YOUR_KEY_PASSWORD"
  echo "  keyAlias=migo"
  echo "  storeFile=release/migo-release.jks"
  echo ""
  exit 1
fi

# ── 4. Gradle AAB 빌드 ───────────────────────────────────────────
echo ""
echo "🏗️  Step 3: Building Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease --no-daemon
cd ..

# ── 5. 결과물 위치 안내 ───────────────────────────────────────────
AAB_PATH="android/app/build/outputs/bundle/release/app-release.aab"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build complete!"
echo ""
echo "📁 AAB Location:"
echo "   $AAB_PATH"
echo ""
echo "📋 Next Steps:"
echo "   1. Google Play Console → 앱 → 프로덕션 → 새 릴리즈 만들기"
echo "   2. AAB 파일 업로드"
echo "   3. 릴리즈 노트 작성 (한국어/영어)"
echo "   4. 검토 제출"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
