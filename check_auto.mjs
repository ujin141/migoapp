import fs from 'fs';

const en = fs.readFileSync('src/i18n/locales/en.ts', 'utf8');
const lines = en.split('\n');

// Check auto namespace Korean values
let inAuto = false;
let koCount = 0;
console.log('=== Korean in en.ts auto namespace ===');
lines.forEach((line, i) => {
  if (line.includes('"auto"')) inAuto = true;
  if (inAuto && /[가-힣]/.test(line) && !line.trim().startsWith('//')) {
    koCount++;
    if (koCount <= 30) console.log(`L${i+1}: ${line.trim().substring(0, 100)}`);
  }
});
console.log(`Total KO in auto:`, koCount);

// Also check how many auto keys exist
const autoStart = en.indexOf('"auto"');
const autoContent = autoStart >= 0 ? en.substring(autoStart, autoStart + 500) : 'NOT FOUND';
console.log('\nauto namespace preview:\n', autoContent.substring(0, 300));
