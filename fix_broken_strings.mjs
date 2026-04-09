/**
 * fix_broken_strings.mjs
 * Finds ALL lines in all locale files that have unescaped quotes in string values
 * and fixes them. These come from sync_auto.mjs propagating en.ts broken values.
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect lines that have a broken pattern: a closing " followed by Korean text
    // Pattern: "key": "some text"Korean text...",
    // This means there's an unescaped quote in the string value
    
    // Simplified check: if line has a key-value pair structure but also has Korean
    // AFTER what appears to be the closing quote of the value
    const keyValueMatch = line.match(/^(\s*"[^"]+"\s*:\s*)"(.*)"무([^"]*)",?/);
    if (keyValueMatch) {
      // The string value was broken by an unescaped quote
      // Keep only the part before the Korean suffix
      const prefix = keyValueMatch[1];
      const value = keyValueMatch[2];
      const trailingComma = line.trimEnd().endsWith(',') ? ',' : '';
      lines[i] = `${line.match(/^\s*/)[0]}"${line.match(/"([^"]+)"/)[1]}": "${value}"${trailingComma}`;
      console.log(`Fixed ${file}:${i+1}: truncated broken value`);
      changed = true;
      totalFixed++;
      continue;
    }
    
    // Also catch patterns where the value ends with Korean then more quoted text
    // Like: "value text"한국어\",
    const koreanAfterQuote = line.match(/^(\s*"[^"]+"\s*:\s*)"([^"]+)"[가-힣]/);
    if (koreanAfterQuote) {
      const indent = line.match(/^\s*/)[0];
      const key = line.match(/"([^"]+)"/)[1];
      const value = koreanAfterQuote[2];
      const trailingComma = line.trimEnd().endsWith(',') ? ',' : '';
      lines[i] = `${indent}"${key}": "${value}"${trailingComma}`;
      console.log(`Fixed ${file}:${i+1}: removed Korean after closing quote`);
      changed = true;
      totalFixed++;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
}

console.log(`\nTotal fixes: ${totalFixed}`);
