import fs from 'fs';
import path from 'path';

function parseTsObject(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let clean = content.trim();
  clean = clean.replace(/^const\s+\w+\s*=\s*/, '');
  clean = clean.replace(/^export default\s+/, '');
  clean = clean.replace(/export default\s+\w+;?\s*$/, '');
  clean = clean.trim();
  if (clean.endsWith(';')) clean = clean.substring(0, clean.length - 1).trim();
  
  try {
    const obj = (new Function(`return (${clean})`))();
    return obj;
  } catch (e) {
    console.error(`Error parsing ${filePath}:`, e.message);
    return null;
  }
}

const koreanRegex = /[\uac00-\ud7a3]/;

function findKoreanKeys(koObj, targetObj, prefix = '') {
  let list = [];
  for (const [key, value] of Object.entries(targetObj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    // Sibling value in ko.ts
    const koValue = koObj ? koObj[key] : null;
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // Check if any element of array contains Korean
        const hasKo = value.some(val => typeof val === 'string' && koreanRegex.test(val));
        if (hasKo) {
          list.push({ path: fullPath, type: 'array', targetVal: value, koVal: koValue || value, key, parent: targetObj });
        }
      } else {
        list = list.concat(findKoreanKeys(koValue, value, fullPath));
      }
    } else if (typeof value === 'string' && koreanRegex.test(value)) {
      list.push({ path: fullPath, type: 'string', targetVal: value, koVal: koValue || value, key, parent: targetObj });
    }
  }
  return list;
}

const ko = parseTsObject('src/i18n/locales/ko.ts');
const targetLangs = ['en', 'ja', 'zh'];

targetLangs.forEach(lang => {
  const filePath = `src/i18n/locales/${lang}.ts`;
  const obj = parseTsObject(filePath);
  if (!obj) return;
  
  const list = findKoreanKeys(ko, obj);
  console.log(`Lang [${lang}]: found ${list.length} keys with Korean values.`);
});
