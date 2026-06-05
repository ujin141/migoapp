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

const ko = parseTsObject('src/i18n/locales/ko.ts');
const en = parseTsObject('src/i18n/locales/en.ts');

console.log('ko keys:', ko ? Object.keys(ko).length : 'failed');
console.log('en keys:', en ? Object.keys(en).length : 'failed');
