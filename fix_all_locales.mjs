import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Fix all locale files with the broken "개더무료vsPlus" string value
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('개더무료vsPlus_1497') || lines[i].includes('\uAC1C\uB354\uBB34\uB8CCvsPlus_1497')) {
      const old = lines[i];
      // Replace the entire line regardless of what broken value it has
      lines[i] = '    "z_개더무료vsPlus_1497": "More \u2192 Check the Free vs Plus tab",';
      if (lines[i] !== old) {
        changed = true;
        totalFixed++;
        console.log(`Fixed ${file}:${i+1}`);
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
}

console.log(`Total files fixed: ${totalFixed}`);
