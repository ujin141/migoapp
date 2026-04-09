import fs from 'fs';
import { globSync } from 'glob';

// 1. Parse ko.ts
let koContent = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');
const startIdx = koContent.indexOf('{');
const endIdx = koContent.lastIndexOf('}');
const jsonStr = koContent.substring(startIdx, endIdx + 1);
const koObj = (new Function(`return (${jsonStr})`))();

// Resolve function
function resolveRealKey(key) {
  let val = koObj[key];
  let currentKey = key;
  while (typeof val === 'string' && val.startsWith('auto.')) {
     currentKey = val.substring(5);
     val = koObj[currentKey];
  }
  return currentKey;
}

// 2. Process all tsx/ts files
const files = globSync('src/**/*.{ts,tsx}');
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Flatten t(t(...)) loop
  let iterations = 0;
  while (iterations < 10) {
    const prev = content;
    // t(t("...")) -> t("...")
    content = content.replace(/t\(\s*t\(([^)]+)\)\s*\)/g, 't($1)');
    content = content.replace(/i18n\.t\(\s*i18n\.t\(([^)]+)\)\s*\)/g, 'i18n.t($1)');
    content = content.replace(/i18n\.t\(\s*t\(([^)]+)\)\s*\)/g, 'i18n.t($1)');
    content = content.replace(/t\(\s*i18n\.t\(([^)]+)\)\s*\)/g, 't($1)');
    if (prev === content) break;
    iterations++;
  }

  // Resolve autoz keys
  content = content.replace(/(['"])auto\.(z_[a-zA-Z0-9_]+)\1/g, (match, quote, key) => {
    const realKey = resolveRealKey(key);
    return `${quote}auto.${realKey}${quote}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
}

console.log(`Cleaned ${changedFiles} files with double translations.`);
