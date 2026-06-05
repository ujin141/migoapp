import fs from 'fs';
import path from 'path';

const localesDir = 'src/i18n/locales';
const files = fs.readdirSync(localesDir);
const koreanRegex = /[\uac00-\ud7a3]/;

files.forEach(file => {
  if (file === 'ko.ts') return;
  if (!file.endsWith('.ts')) return;
  
  const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
  const lines = content.split('\n');
  
  let found = 0;
  lines.forEach((line, idx) => {
    if (koreanRegex.test(line)) {
      if (found < 10) {
        console.log(`[${file}] Line ${idx + 1}: ${line.trim()}`);
      }
      found++;
    }
  });
  
  if (found > 0) {
    console.log(`==> ${file} has ${found} lines with Korean characters.\n`);
  }
});
