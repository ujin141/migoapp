/**
 * fix_unescaped_quotes.mjs
 * Finds and fixes lines with unescaped double quotes inside TS string values.
 * These cause build failures with "Expected }" or "Unterminated string".
 */
import fs from 'fs';
import path from 'path';

const dir = './src/i18n/locales';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let totalFixed = 0;

for (const file of files) {
  const fp = path.join(dir, file);
  const lines = fs.readFileSync(fp, 'utf8').split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match lines like:    "key": "value with "unescaped" quotes",
    // The pattern is: starts with spaces, then "key": "value" but value has extra unescaped "
    // Example broken: "p3": "Do you really want to delete the product '{{title}}'?"{{title}}\";"
    
    // Strategy: Every valid TS object property line should look like:
    // `    "key": "escaped value",`
    // If a line starts with whitespace + a key-value pair but then has extra content
    // after what should be the closing quote, we need to fix it.
    
    // First check: does the line match the key-value pattern but have broken quoting?
    // A well-formed line: /^\s+"[^"]+"\s*:\s*"([^"\\]|\\.)*",?\s*$/
    const wellFormed = /^\s+"[^"]+"\s*:\s*"([^"\\]|\\.)*",?\s*$/.test(line);
    
    if (!wellFormed && line.includes('": "') && !line.includes('//')) {
      // Try to detect broken quote pattern: "key": "valid start"extra garbage",
      // Extract key
      const keyMatch = line.match(/^(\s+)"([^"]+)"\s*:\s*"(.*)/);
      if (keyMatch) {
        const indent = keyMatch[1];
        const key = keyMatch[2];
        const rest = keyMatch[3];
        
        // Find the FIRST unescaped closing quote in rest to determine the intended value
        let pos = 0;
        let escaped = false;
        while (pos < rest.length) {
          if (escaped) { escaped = false; pos++; continue; }
          if (rest[pos] === '\\') { escaped = true; pos++; continue; }
          if (rest[pos] === '"') break; // Found first closing quote
          pos++;
        }
        
        if (pos < rest.length) {
          const value = rest.substring(0, pos);
          // Check what comes after
          const after = rest.substring(pos + 1).trim();
          // Valid endings: empty, ",", "," with trailing content = wrong
          if (after !== '' && after !== ',' && !after.match(/^,?\s*$/) && !after.startsWith('//')) {
            // This line has garbage after the first closing quote
            const hasTrailingComma = after.includes(',') || i < lines.length - 1;
            const fixed_line = `${indent}"${key}": "${value}",`;
            console.log(`${file}:${i+1} FIX: "${key}" had: ${line.trim().substring(0,60)}`);
            lines[i] = fixed_line;
            changed = true;
          }
        }
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(fp, lines.join('\n'), 'utf8');
    totalFixed++;
    console.log(`  → Fixed: ${file}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
