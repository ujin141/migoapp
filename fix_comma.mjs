import fs from 'fs';
import path from 'path';

const dir = './src/i18n/locales';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let fixed = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  let lines = fs.readFileSync(fp, 'utf8').split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // If this line has t5009 without trailing comma, and next line has t5010
    if (line.includes('"t5009"') && !line.trim().endsWith(',') && nextLine.includes('"t5010"')) {
      lines[i] = line + ',';
      changed = true;
      console.log(`${file}:${i+1} fixed missing comma`);
    }
  }
  
  if (changed) {
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
    fixed++;
  }
}

console.log('\nTotal files fixed:', fixed);
