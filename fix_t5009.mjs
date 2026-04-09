import fs from 'fs';
import path from 'path';

const dir = './src/i18n/locales';

// Fix corrupted t5009 across ALL locales
// The bug: regex matched greedily and appended old Korean text to the new English value
// Corrupted pattern: "\"{{v0}}\" group has 1 spot left! Apply now"{{v0}}\" 자리..."
// We need to fix this in all files

const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let fixed = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf8');
  const before = c;
  
  // Fix the corrupted t5009 - the regex left garbage after the initial replacement
  // Pattern: t5009 key followed by a broken value with leftover Korean text
  // Use a line-based approach: find the line with t5009 and replace entirely
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"t5009"')) {
      lines[i] = '    "t5009": "\\"{{v0}}\\" group has 1 spot left! Apply now"';
    }
  }
  c = lines.join('\n');
  
  if (c !== before) {
    fs.writeFileSync(fp, c, 'utf8');
    fixed++;
    console.log('Fixed t5009: ' + file);
  }
}

console.log('\nTotal fixed:', fixed);
