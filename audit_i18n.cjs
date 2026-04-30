// audit_i18n.cjs - Comprehensive i18n quality check
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = 'src/i18n/locales';
const FILTER_FILE = 'src/i18n/filterLocales.ts';
const CHECKIN_FILE = 'src/i18n/checkinLocales.ts';

// All 49 supported languages from index.ts
const ALL_LANGS = [
  'ko','en','ja','zh','es','pt','fr','de','it','nl','pl','sv','da','no','fi',
  'cs','ro','hu','el','uk','ru','ar','hi','tr','id','vi','th','ms','my','km',
  'tl','bn','ur','fa','he','am','sw','yo','ig','ha','zu','xh','af','sq','hy',
  'ka','az','kk','uz'
];

// Keys that MUST be translated (not English) in each locale file
const ENGLISH_SAMPLE_KEYS = [
  '"distanceUnknown"',
  '"nearby"',
  '"loading"',
  '"noMore"',
  '"matched"',
  '"noChats"',
  '"groups"'
];

const ENGLISH_VALUES = [
  'Distance unknown',
  'Nearby travelers',
  'Loading map',
  'You\'ve seen all nearby',
  'It\'s a match',
  'No chats yet',
  'Travel groups'
];

const issues = [];
const pass = [];
let totalChecked = 0;

// ── 1. Check locale files ──────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  MIGO I18N QUALITY AUDIT');
console.log('═══════════════════════════════════════\n');

const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
console.log(`📁 Locale files found: ${localeFiles.length}`);

const hasCoverage = {};
for (const file of localeFiles) {
  const lang = file.replace('.ts', '');
  const fp = path.join(LOCALES_DIR, file);
  const content = fs.readFileSync(fp, 'utf8');
  
  // Skip en.ts and ko.ts (reference files)
  if (lang === 'en' || lang === 'ko') {
    pass.push(`${lang}: reference file (skip deep check)`);
    hasCoverage[lang] = true;
    continue;
  }
  
  hasCoverage[lang] = true;
  totalChecked++;
  
  // Check for English stubs in key sections
  const englishStubs = [];
  const englishCheck = [
    { pattern: /"distanceUnknown":\s*"Distance unknown"/, key: 'map.distanceUnknown' },
    { pattern: /"noMore":\s*"You've seen all/, key: 'match.noMore' },
    { pattern: /"noChats":\s*"No chats yet"/, key: 'chat.noChats' },
    { pattern: /"title":\s*"Travel groups"/, key: 'discover.title~groups' },
    { pattern: /"loading":\s*"Loading map\.\.\."/, key: 'map.loading' },
    { pattern: /"matched":\s*"It's a match!"/, key: 'match.matched' },
    { pattern: /"startChat":\s*"Start chatting"/, key: 'match.startChat' },
  ];
  
  for (const check of englishCheck) {
    if (check.pattern.test(content)) {
      englishStubs.push(check.key);
    }
  }
  
  // Check file size (too small = incomplete)
  const size = fs.statSync(fp).size;
  
  if (englishStubs.length > 0) {
    issues.push(`❌ ${lang}: still has English stubs → [${englishStubs.join(', ')}]`);
  } else if (size < 5000) {
    issues.push(`⚠️  ${lang}: file suspiciously small (${size} bytes)`);
  } else {
    pass.push(`✅ ${lang}: OK (${Math.round(size/1024)}KB, no English stubs)`);
  }
}

// ── 2. Check filterLocales.ts ──────────────────────────────────────────────
console.log('\n📋 filterLocales.ts coverage:');
const filterContent = fs.readFileSync(FILTER_FILE, 'utf8');
const filterLangs = [];
const filterMissing = [];

for (const lang of ALL_LANGS) {
  const re = new RegExp(`^  ${lang}:`, 'm');
  if (re.test(filterContent)) {
    filterLangs.push(lang);
  } else {
    filterMissing.push(lang);
  }
}

console.log(`  ✅ Has: ${filterLangs.join(', ')}`);
if (filterMissing.length > 0) {
  console.log(`  ❌ Missing: ${filterMissing.join(', ')}`);
  issues.push(`filterLocales.ts missing: [${filterMissing.join(', ')}]`);
}

// ── 3. Check checkinLocales.ts ─────────────────────────────────────────────
console.log('\n📋 checkinLocales.ts coverage:');
const checkinContent = fs.readFileSync(CHECKIN_FILE, 'utf8');
const checkinLangs = [];
const checkinMissing = [];

for (const lang of ALL_LANGS) {
  const re = new RegExp(`^  ${lang}:`, 'm');
  if (re.test(checkinContent)) {
    checkinLangs.push(lang);
  } else {
    checkinMissing.push(lang);
  }
}

console.log(`  ✅ Has: ${checkinLangs.join(', ')}`);
if (checkinMissing.length > 0) {
  console.log(`  ⚠️  Missing (will fallback to 'en'): ${checkinMissing.join(', ')}`);
}

// ── 4. Specific value spot checks ──────────────────────────────────────────
console.log('\n🔍 Spot check — key values per language:');

const SPOT_CHECKS = [
  { lang: 'ja', key: '"distanceUnknown"', expected: '距離不明', contains: true },
  { lang: 'fr', key: '"matched"', expected: 'match', contains: true },
  { lang: 'de', key: '"noMore"', expected: 'gesehen', contains: true },
  { lang: 'ar', key: '"distanceUnknown"', expected: 'غير', contains: true },
  { lang: 'zh', key: '"distanceUnknown"', expected: '未知', contains: true },
  { lang: 'ru', key: '"matched"', expected: 'совпадение', contains: true },
  { lang: 'hi', key: '"matched"', expected: '', contains: false },
  { lang: 'th', key: '"loading"', expected: 'กำลัง', contains: true },
  { lang: 'vi', key: '"noChats"', expected: '', contains: false },
  { lang: 'id', key: '"title"', expected: 'Peta', contains: true },
  { lang: 'ko', key: '"nearby"', expected: '근처', contains: true },
  { lang: 'pl', key: '"matched"', expected: 'dopasowanie', contains: true },
  { lang: 'tr', key: '"matched"', expected: 'eşleşme', contains: true },
];

const spotIssues = [];
for (const check of SPOT_CHECKS) {
  const fp = path.join(LOCALES_DIR, `${check.lang}.ts`);
  if (!fs.existsSync(fp)) {
    spotIssues.push(`${check.lang}: file not found`);
    continue;
  }
  const content = fs.readFileSync(fp, 'utf8');
  
  if (check.contains && check.expected) {
    // Find the key's value
    const re = new RegExp(`${check.key}:\\s*"([^"]*)"`);
    const m = content.match(re);
    if (!m) {
      spotIssues.push(`${check.lang}/${check.key}: key not found`);
    } else if (!m[1].includes(check.expected)) {
      spotIssues.push(`${check.lang}/${check.key}: value="${m[1]}" doesn't contain "${check.expected}"`);
      console.log(`  ⚠️  ${check.lang}/${check.key} = "${m[1]}"`);
    } else {
      console.log(`  ✅ ${check.lang}/${check.key} = "${m[1]}"`);
    }
  }
}

// ── 5. Summary ─────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log('  RESULTS SUMMARY');
console.log('═══════════════════════════════════════');
console.log(`\n✅ PASS (${pass.length}):`);
for (const p of pass) console.log('  ' + p);

if (issues.length > 0) {
  console.log(`\n❌ ISSUES (${issues.length}):`);
  for (const i of issues) console.log('  ' + i);
} else {
  console.log('\n🎉 No critical issues found!');
}

if (spotIssues.length > 0) {
  console.log(`\n⚠️  SPOT CHECK WARNINGS (${spotIssues.length}):`);
  for (const i of spotIssues) console.log('  ' + i);
}

console.log(`\n📊 Total locale files checked: ${totalChecked}`);
console.log(`   filterLocales languages: ${filterLangs.length}/49`);
console.log(`   checkinLocales languages: ${checkinLangs.length}/49`);
console.log('═══════════════════════════════════════\n');
