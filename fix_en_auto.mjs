/**
 * fix_en_auto_ko.mjs
 * Find and report Korean values remaining in en.ts auto namespace
 */
import fs from 'fs';

const en = fs.readFileSync('./src/i18n/locales/en.ts', 'utf8');
const lines = en.split('\n');

const koLines = [];
let inAuto = false;
lines.forEach((line, i) => {
  if (line.includes('"auto"')) inAuto = true;
  if (inAuto && /[가-힣]/.test(line) && !line.trim().startsWith('//')) {
    // Only show lines where the VALUE part has Korean (after the colon)
    const m = line.match(/"[^"]+"\s*:\s*"([^"]*[가-힣][^"]*)"/);
    if (m) {
      koLines.push({ lineNum: i + 1, text: line.trim().substring(0, 120), koValue: m[1] });
    }
  }
});

console.log(`Korean-valued auto keys in en.ts: ${koLines.length}`);
koLines.slice(0, 30).forEach(k => console.log(`L${k.lineNum}: ${k.text}`));
if (koLines.length > 30) console.log(`... and ${koLines.length - 30} more`);
