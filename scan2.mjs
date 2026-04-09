import fs from 'fs';
import path from 'path';

const SRC = './src';
const results = [];

function hasKorean(str) {
  return /[가-힣]/.test(str);
}

function scanDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !['node_modules','.git','dist','locales'].includes(f)) {
      scanDir(full);
    } else if (f.match(/\.(tsx|ts)$/) && !f.includes('.d.ts')) {
      const lines = fs.readFileSync(full,'utf8').split('\n');
      lines.forEach((line, i) => {
        const t = line.trim();
        if (hasKorean(line) &&
            !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') &&
            !t.includes('i18n.t(') &&
            !t.match(/t\(["'`]/) &&
            !t.includes('defaultValue') &&
            !f.includes('ko.ts')) {
          const rel = full.replace(process.cwd() + path.sep, '');
          results.push({ file: rel, line: i+1, text: t.substring(0, 150) });
        }
      });
    }
  }
}

scanDir(SRC);

// group by file
const byFile = {};
for (const r of results) {
  if (!byFile[r.file]) byFile[r.file] = [];
  byFile[r.file].push(r);
}

for (const [file, items] of Object.entries(byFile)) {
  console.log(`\n=== ${file} ===`);
  for (const item of items) {
    console.log(`  L${item.line}: ${item.text}`);
  }
}
console.log(`\nTotal: ${results.length} Korean strings in ${Object.keys(byFile).length} files`);
