import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, 'src', 'i18n', 'locales');

const files = readdirSync(localesDir).filter(f => f.endsWith('.ts'));

let fixedCount = 0;

for (const file of files) {
  const filePath = join(localesDir, file);
  try {
    let content = readFileSync(filePath, 'utf-8');
    const badPattern = /"groupModal":\s*\{\r?\n\s*\}[^]*?"groupModal":\s*\{/;
    
    if (badPattern.test(content)) {
      content = content.replace(badPattern, '"groupModal": {');
      writeFileSync(filePath, content, 'utf-8');
      fixedCount++;
      console.log(`- Fixed syntax error in ${file}`);
    }
  } catch (err) {
    console.error(`Failed to process ${file}:`, err);
  }
}

console.log(`\nDONE: Fixed syntax errors in ${fixedCount} files.`);
