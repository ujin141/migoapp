const fs = require('fs');
const glob = require('glob');
const path = require('path');

const i18nMap = {};

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Match t("key", "value") or i18n.t("key", "value")
  // Regex looking for t( 'key' , 'value' )
  const regex = /(?:i18n\.)?t\(\s*(["'])(.+?)\1\s*,\s*(["'])(.+?)\3\s*\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const key = match[2];
    const value = match[4];
    if (i18nMap[key] === undefined) {
      i18nMap[key] = value;
    }
  }
}

// Find all tsx and ts files
const files = glob.sync('src/**/*.{ts,tsx}');
files.forEach(processFile);

fs.writeFileSync('extracted_keys_base.json', JSON.stringify(i18nMap, null, 2));
console.log(`Extracted ${Object.keys(i18nMap).length} keys from ${files.length} files.`);
