#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  Migo iOS App Store 배포 자동화 스크립트
#  사용법: bash build_appstore.sh
# ═══════════════════════════════════════════════════════════

set -e  # 오류 발생 시 즉시 중단

WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
ARCHIVE_PATH="ios/build/Migo.xcarchive"
EXPORT_PATH="ios/build/ipa"
EXPORT_OPTIONS="ios/ExportOptions.plist"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   🚀 Migo App Store 배포 빌드 시작       ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1단계: 웹 빌드 ─────────────────────────────────────────────────────
echo "📦 [1/4] 웹 앱 빌드 중..."
npm run build
echo "✅ 웹 빌드 완료"

# ── 2단계: Capacitor iOS 동기화 ────────────────────────────────────────
echo ""
echo "🔄 [2/4] iOS 네이티브 동기화 중..."
npx cap sync ios
echo "✅ iOS 동기화 완료"

# ── 3단계: Xcode Archive ───────────────────────────────────────────────
echo ""
echo "🏗️  [3/4] Xcode Archive 빌드 중... (약 3~5분 소요)"
mkdir -p ios/build

xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic

echo "✅ Archive 완료: $ARCHIVE_PATH"

# ── 4단계: IPA 내보내기 ────────────────────────────────────────────────
echo ""
echo "📤 [4/4] IPA 내보내기 및 App Store Connect 업로드 중..."
mkdir -p "$EXPORT_PATH"

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  🎉 배포 완료!                           ║"
echo "║                                          ║"
echo "║  IPA 위치:                               ║"
echo "║  ios/build/ipa/Migo.ipa                  ║"
echo "║                                          ║"
echo "║  다음 단계:                              ║"
echo "║  → App Store Connect 에서 빌드 확인      ║"
echo "║  → https://appstoreconnect.apple.com     ║"
echo "╚══════════════════════════════════════════╝"
echo ""
