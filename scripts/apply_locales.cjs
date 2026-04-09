const fs = require('fs');
const glob = require('glob');
const path = require('path');

const astKeys = JSON.parse(fs.readFileSync('extracted_i18n_keys.json', 'utf8'));
const baseKeys = JSON.parse(fs.readFileSync('extracted_keys_base.json', 'utf8'));

// Merge
const allKeys = { ...baseKeys, ...astKeys };

const localesPattern = 'src/i18n/locales/*.ts';
const files = glob.sync(localesPattern);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find where the object starts
  const match = content.match(/export default \S*?\s*{([\s\S]*?)};?/);
  if (!match) return;
  
  let objBody = match[1];
  
  // We don't want to parse it as JSON because it's TypeScript.
  // Instead, we can just append missing keys.
  // This is a naive but effective way for our temporary mapping.
  let appendString = ``;
  
  for (const [key, value] of Object.entries(allKeys)) {
    // If the key is not already inside the text
    if (!content.includes(`"${key}":`) && !content.includes(`'${key}':`)) {
      const escapedValue = (String(value)).replace(/"/g, '\\"').replace(/\n/g, '\\n');
      appendString += `\n  "${key}": "${escapedValue}",`;
    }
  }
  
  if (appendString) {
    // Append right before the closing brace
    const insertIdx = content.lastIndexOf('}');
    if (insertIdx !== -1) {
      const newContent = content.slice(0, insertIdx) + appendString + '\n' + content.slice(insertIdx);
      fs.writeFileSync(file, newContent, 'utf8');
    }
  }
});

console.log(`Injected ${Object.keys(allKeys).length} baseline keys into ${files.length} locale files.`);
