import fs from 'fs';
import path from 'path';

const localesDir = 'src/i18n/locales';
const files = fs.readdirSync(localesDir);
const koreanRegex = /[\uac00-\ud7a3]/;

const results = [];
files.forEach(file => {
  if (file === 'ko.ts') return;
  if (!file.endsWith('.ts')) return;
  
  const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
  const lines = content.split('\n');
  
  let count = 0;
  lines.forEach(line => {
    if (koreanRegex.test(line)) {
      count++;
    }
  });
  
  results.push({ file, count });
});

results.sort((a, b) => b.count - a.count);
results.forEach(res => {
  console.log(`${res.file}: ${res.count} lines containing Korean.`);
});
