/**
 * sync_auto_namespace.mjs
 * 
 * The 'auto' namespace in en.ts has correct English translations.
 * All other non-KO locale files should use en.ts auto values as fallback
 * since those translations are per-key English overrides.
 * 
 * This script:
 * 1. Extracts all key-value pairs from the 'auto' namespace of en.ts
 * 2. For each non-KO locale file, replaces any Korean-valued auto keys with the EN equivalent
 */

import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';

// Parse key: value pairs from a locale file's auto namespace
function extractAutoBlock(content) {
  const autoStart = content.indexOf('"auto":');
  if (autoStart === -1) return null;
  
  // Find the matching closing brace
  let depth = 0;
  let start = content.indexOf('{', autoStart);
  let end = start;
  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  return { start, end, block: content.substring(start, end + 1) };
}

// Read en.ts to get the authoritative auto block
const enContent = fs.readFileSync(path.join(LOCALES_DIR, 'en.ts'), 'utf8');
const enAuto = extractAutoBlock(enContent);
if (!enAuto) { console.error('Could not find auto namespace in en.ts'); process.exit(1); }

const enAutoBlock = enAuto.block;

console.log(`en.ts auto namespace: ${enAutoBlock.length} chars`);

// Parse individual key-value string entries from the block
// Format: "key": "value"
const KV_REGEX = /"([^"]+)":\s*"([^"]*(?:\\.[^"]*)*)"/g;

const enMap = new Map();
let m;
const tempBlock = enAutoBlock;
while ((m = KV_REGEX.exec(tempBlock)) !== null) {
  enMap.set(m[1], m[2]);
}
console.log(`Found ${enMap.size} key-value pairs in en.ts auto namespace`);

// For each non-KO locale, sync auto namespace
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts' && f !== 'en.ts');

let totalFixed = 0;
let filesFixed = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const autoBlock = extractAutoBlock(content);
  if (!autoBlock) {
    console.log(`SKIP ${file} - no auto namespace`);
    continue;
  }
  
  let localAuto = autoBlock.block;
  let changed = false;
  
  // For each key in en.ts auto, check if the locale file has it with Korean value
  for (const [key, enVal] of enMap) {
    // Match "key": "<any value that has Korean chars>"
    const koPattern = new RegExp(`("${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}":\\s*)"([^"]*[가-힣][^"]*)"`, 'g');
    const replacement = `$1"${enVal}"`;
    const newLocal = localAuto.replace(koPattern, replacement);
    if (newLocal !== localAuto) {
      totalFixed++;
      changed = true;
      localAuto = newLocal;
    }
  }
  
  if (changed) {
    const newContent = content.substring(0, autoBlock.start) + localAuto + content.substring(autoBlock.end + 1);
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesFixed++;
    console.log(`✅ Fixed ${file}`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} Korean values in ${filesFixed} locale files.`);
