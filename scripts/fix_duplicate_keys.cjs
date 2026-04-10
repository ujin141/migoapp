const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') || f.endsWith('.json'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(localesDir, file);
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');
  const keySet = new Set();
  const duplicateLines = new Set();
  
  lines.forEach((line, i) => {
    const match = line.match(/^\s*["'](auto\.[^"']+)["']\s*:/);
    if (match) {
      const key = match[1];
      if (keySet.has(key)) {
        duplicateLines.add(i);
      } else {
        keySet.add(key);
      }
    }
  });

  if (duplicateLines.size > 0) {
    const newLines = lines.filter((_, i) => !duplicateLines.has(i));
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`Fixed duplicates in ${file}: removed ${duplicateLines.size} lines`);
    totalFixed++;
  }
}
console.log(`Finished fixing ${totalFixed} files.`);
