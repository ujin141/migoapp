import fs from 'fs';
import path from 'path';

const dir = './src/i18n/locales';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let fixed = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let c = fs.readFileSync(fp, 'utf8');
  const before = c;

  // Fix t5009 and t5010 - these have unescaped quotes or Korean text
  // t5009 should be English
  c = c.replace(/"t5009":\s*"[^"]*"/g, '"t5009": "\\"{{v0}}\\" group has 1 spot left! Apply now"');
  // t5010 - the bug value has unescaped " inside string
  // We need to handle: "t5010": "🔴 "{{v0}}\" 자리 1개 남았어요!"
  // The raw bytes will have an unescaped " after 🔴 
  // Use a broader regex to catch broken variants
  c = c.replace(/"t5010":\s*"[^,\n]*?(?:"[^,\n]*?)*?(?=,?\s*\n\s*")/g, '"t5010": "🔴 {{v0}} - 1 spot left!"');

  if (c !== before) {
    fs.writeFileSync(fp, c, 'utf8');
    fixed++;
    console.log('Fixed: ' + file);
  }
}
console.log('\nTotal fixed:', fixed);
