import fs from 'fs';
import path from 'path';

const SRC = './src';
const results = [];

function hasKorean(str) {
  return /[\uAC00-\uD7A3]/.test(str);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rel = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
  
  lines.forEach((line, i) => {
    if (!hasKorean(line)) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    // Skip already using t() for Korean
    if (t.match(/\bt\(["'`][^"'`]*[\uAC00-\uD7A3]/)) return;
    if (t.match(/i18n\.t\(["'`][^"'`]*[\uAC00-\uD7A3]/)) return;
    // JSX text content
    if (t.match(/>([^<>{]*[\uAC00-\uD7A3][^<>{]*)</)) {
      results.push({ file: rel, line: i+1, type: 'JSX_TEXT', text: t.substring(0, 120) });
      return;
    }
    // String props
    if (t.match(/(?:placeholder|title|label|alt|aria-label)=["'][^"']*[\uAC00-\uD7A3]/)) {
      results.push({ file: rel, line: i+1, type: 'PROP', text: t.substring(0, 120) });
      return;
    }
    // Korean in array literals that render
    if (t.match(/["'`][^"'`]*[\uAC00-\uD7A3][^"'`]*["'`]/) && !t.includes('.t(') && (t.includes('.map(') || t.includes('toast(') || t.includes('title:') || t.includes('description:'))) {
      results.push({ file: rel, line: i+1, type: 'DATA', text: t.substring(0, 120) });
    }
  });
}

function walkDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'locales'].includes(f)) {
      walkDir(full);
    } else if (f.match(/\.(tsx|ts)$/) && !f.includes('.d.ts') && !f.includes('ko.ts') && !f.includes('en.ts')) {
      scanFile(full);
    }
  }
}

walkDir(SRC);

const byFile = {};
for (const r of results) {
  if (!byFile[r.file]) byFile[r.file] = [];
  byFile[r.file].push(r);
}

console.log('VISIBLE KOREAN: ' + results.length + ' instances in ' + Object.keys(byFile).length + ' files\n');
for (const [file, items] of Object.entries(byFile)) {
  console.log('\n### ' + file + ' (' + items.length + ')');
  for (const item of items) {
    console.log('  [' + item.type + '] L' + item.line + ': ' + item.text);
  }
}
