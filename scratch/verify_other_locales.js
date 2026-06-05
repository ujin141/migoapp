import fs from 'fs';

const files = [
  'src/i18n/checkinLocales.ts',
  'src/i18n/filterLocales.ts',
  'src/i18n/gdfLocales.ts',
  'src/i18n/mapLocales.ts',
  'src/i18n/migoPlusLocales.ts',
  'src/i18n/retentionLocales.ts',
  'src/i18n/tierLocales.ts'
];

const koreanRegex = /[\uac00-\ud7a3]/;

function parseTsObject(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  let clean = content.trim();
  clean = clean.replace(/^export const \w+(:\s*Record<.*?>)?\s*=\s*/, '');
  clean = clean.replace(/;?\s*$/, '');
  
  try {
    const obj = (new Function(`return (${clean})`))();
    return obj;
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e.message);
    return null;
  }
}

function findKoreanInObject(obj, prefix = '') {
  let list = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      list = list.concat(findKoreanInObject(value, fullPath));
    } else if (typeof value === 'string' && koreanRegex.test(value)) {
      list.push({ path: fullPath, value });
    }
  }
  return list;
}

files.forEach(file => {
  const obj = parseTsObject(file);
  if (!obj) return;
  
  console.log(`\n=== File: ${file} ===`);
  for (const [lang, langObj] of Object.entries(obj)) {
    if (lang === 'ko') continue; // skip ko
    const list = findKoreanInObject(langObj);
    if (list.length > 0) {
      console.log(`Language [${lang}] has ${list.length} Korean values:`);
      list.forEach(item => {
        console.log(`  Path: ${item.path} -> "${item.value}"`);
      });
    } else {
      console.log(`Language [${lang}] is clean.`);
    }
  }
});
