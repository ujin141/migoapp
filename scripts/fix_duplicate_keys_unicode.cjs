const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') || f.endsWith('.json'));

function unescapeUnicode(str) {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
}

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
      const rawKey = match[1];
      const normKey = unescapeUnicode(rawKey);
      
      if (keySet.has(normKey)) {
        duplicateLines.add(i);
      } else {
        keySet.add(normKey);
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
console.log(`Finished fixing ${totalFixed} files with unicode deduplication.`);
