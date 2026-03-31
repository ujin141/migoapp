import fs from 'fs';

let content = fs.readFileSync('src/pages/DownloadPage.tsx', 'utf8');

// 1. Change APK_URL
content = content.replace(
  /const APK_URL = "[^"]+";/,
  'const APK_URL = "https://play.google.com/apps/internaltest/4701704404129716915";'
);

// 2. Change handleDownload logic
const oldHandleDownload = `  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = \`migo-v\${APP_VERSION}.apk\`;
    a.click();
    toast({
      title: i18n.t("auto.z_\\uB2E4\\uC6B4\\uB85C\\uB4DC\\uC2DC\\uC791_503"),
      description: i18n.t("auto.z_\\uD30C\\uC77C\\uC571\\uC5D0\\uC11C\\uD655\\uC778\\uD558\\uC138\\uC694_504")
    });
  };`;

const newHandleDownload = `  const handleDownload = () => {
    window.location.href = APK_URL;
  };`;

content = content.replace(oldHandleDownload, newHandleDownload);

// (Optional) Remove unused toast import if it's no longer used, but it's used in handleCopy!
// Keep toast import.

// To be thorough, change the button text to "Play Store 다운로드" using existing translation or a raw string?
// The user asked to just put the URL there: "거기에 URL 다운로드 하는 사이트야 저게"
// It's safest to just adjust the URL.

fs.writeFileSync('src/pages/DownloadPage.tsx', content, 'utf8');
console.log('DownloadPage patched.');
