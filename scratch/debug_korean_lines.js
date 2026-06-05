import fs from 'fs';
const content = fs.readFileSync('src/i18n/locales/en.ts', 'utf8');
const lines = content.split('\n');
const koreanRegex = /[\uac00-\ud7a3]/;

let printed = 0;
lines.forEach((line, idx) => {
  if (koreanRegex.test(line)) {
    if (printed < 50) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
    printed++;
  }
});
console.log(`Total lines with Korean in en.ts: ${printed}`);
