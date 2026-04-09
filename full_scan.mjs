import fs from 'fs';
import path from 'path';

const SRC = './src';

// These are the specific file patterns and string patterns to look for
const PATTERNS = {
  // Korean in t() FALLBACK (second argument): t("key", "한국어") - this IS shown as fallback!
  tFallback: /\bt\(["'][^"']+["'],\s*["'][^"']*[\uAC00-\uD7A3][^"']*["']/,
  // Korean in toast() title/description
  toastKo: /(?:title|description):\s*["'`][^"'`]*[\uAC00-\uD7A3]/,
  // Korean in const/let string arrays (travel styles, options, etc)
  constArray: /["'`][^"'`]*[\uAC00-\uD7A3][^"'`]*["'`]\s*,?\s*(?:\/\/|$)/,
  // Korean directly in JSX text (between > <)
  jsxText: />([^<>{]*[\uAC00-\uD7A3][^<>{]*)</,
  // Korean in string props
  strProp: /(?:placeholder|title|label|alt|content|name|type)=["'`][^"'`]*[\uAC00-\uD7A3]/,
  // Korean in defaultValue
  defaultVal: /defaultValue[:\s=]+["'`][^"'`]*[\uAC00-\uD7A3]/,
};

const results = [];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const rel = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');
  
  lines.forEach((line, i) => {
    if (!/[\uAC00-\uD7A3]/.test(line)) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    
    for (const [name, pat] of Object.entries(PATTERNS)) {
      if (pat.test(line)) {
        // Skip lines that are purely JSX comments
        if (t.startsWith('{/*') || t.endsWith('*/}')) break;
        results.push({ file: rel, line: i+1, type: name, text: t.substring(0, 130) });
        break;
      }
    }
  });
}

function walkDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !['node_modules','.git','dist','locales'].includes(f)) {
      walkDir(full);
    } else if (f.match(/\.(tsx|ts)$/) && !f.includes('.d.ts')) {
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

// Save results
const out = [];
out.push('TOTAL: ' + results.length + ' in ' + Object.keys(byFile).length + ' files\n');
for (const [file, items] of Object.entries(byFile)) {
  out.push('\n=== ' + file + ' (' + items.length + ') ===');
  for (const item of items) {
    out.push('  [' + item.type + '] L' + item.line + ': ' + item.text);
  }
}
fs.writeFileSync('./scan_results.txt', out.join('\n'), 'utf8');
console.log(out.slice(0, 80).join('\n'));
