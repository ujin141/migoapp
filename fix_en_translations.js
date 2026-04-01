const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/i18n/locales/en.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix "dog" translations for auto.z_* "개" and others
content = content.replace(/"z_autozautoz_689":\s*"dog"/g, '"z_autozautoz_689": "items"');
content = content.replace(/"z_개_d22b87":\s*"dog\)"/g, '"z_개_d22b87": " items)"');
content = content.replace(/"z_개_1f31b2":\s*"dog"/g, '"z_개_1f31b2": "items"');
content = content.replace(/"z_개참여완_f9c3ae":\s*"Dog participation completed"/g, '"z_개참여완_f9c3ae": "people have joined"');

// 2. Fix the tripMatch block
const poorTripMatchPattern = /"tripMatch":\s*\{\s*"title":\s*"Processing failed",\s*"subtitle":\s*"Rejection processing completed",\s*"filter":\s*"Cancel",\s*"randomMatch":\s*"Verification Verification ✅",\s*"premiumMatch":\s*"Distance unknown",\s*"searching":\s*"women only",\s*"pass":\s*"(.*?)" 패스 👋",\s*"joinSuccess":\s*"Group participation completion! 🎉"\s*\}/;

const goodTripMatch = `"tripMatch": {
    "title": "Group Match",
    "subtitle": "{{count}} groups are waiting",
    "filter": "Filter",
    "randomMatch": "General Match",
    "premiumMatch": "Premium Match",
    "searching": "Searching for groups...",
    "pass": "Passed {{title}} 👋",
    "joinSuccess": "Joined Group! 🎉"
  }`;

content = content.replace(poorTripMatchPattern, goodTripMatch);

// fallback if the regex fails:
if (content.indexOf("Processing failed") !== -1 && content.indexOf("tripMatch") !== -1) {
    // A simpler regex exactly targeting what we saw
    const tripMatchRegex = /"tripMatch":\s*\{[^}]+\}/;
    content = content.replace(tripMatchRegex, goodTripMatch);
}

// 3. What about "Processing failed" inside findAccount or others?
// "t19Title": "Processing failed"
// "t20Title": "Rejection processing completed"
// "t21Title": "Processing failed"
// We leave them if they are in other places, but maybe fix them to literal "Group Match" etc.
// But they aren't hurting if they are unused. The TripMatch section is exactly the problem.

// 4. Also fix participation cost tags. 
// "여행", "파티 / 클럽", "프리미엄"
// Since these are in src/i18n/tierLocales.ts or src/lib/pricing.ts, we need to check if they are translated.

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed en.ts');
