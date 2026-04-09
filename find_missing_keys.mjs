import fs from 'fs';
import path from 'path';

const koPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'ko.ts');
let koStr = fs.readFileSync(koPath, 'utf8');

const startIdx = koStr.indexOf('{');
const endIdx = koStr.lastIndexOf('}');
const jsonStr = koStr.substring(startIdx, endIdx + 1);
const obj = (new Function(`return (${jsonStr})`))();

function hasKey(o, k) {
  const parts = k.split('.');
  let current = o;
  for (const part of parts) {
    if (current === undefined || current === null) return false;
    current = current[part];
  }
  return current !== undefined;
}

const missingKeys = new Set();
const srcDir = path.join(process.cwd(), 'src');

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const regex1 = /t\(\s*['"]([^'"]+)['"]\s*\)/g;
      let match;
      while ((match = regex1.exec(content)) !== null) {
        const key = match[1];
        if (!hasKey(obj, key)) {
          missingKeys.add(key);
        }
      }
      
      // Check auto prefix without the dot matching
      const regex2 = /['"]([^'"]+)['"]/g;
      // Also catch anything else commonly missed.
    }
  }
}

scanDir(srcDir);

// Filter out dynamic keys or things that are actually variables
const validMissing = Array.from(missingKeys).filter(k => 
    !k.includes('${') && !k.startsWith(' ') && k.length > 2 && !k.includes('===')
);

console.log(JSON.stringify(validMissing, null, 2));
