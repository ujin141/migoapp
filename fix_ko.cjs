const fs = require('fs');
const dict = JSON.parse(fs.readFileSync('/tmp/ko_strings_v2.json', 'utf8'));
const koFilePath = 'src/i18n/locales/ko.ts';
let content = fs.readFileSync(koFilePath, 'utf8');

const missingKeys = [];
for (const k of Object.keys(dict)) {
  if (!content.includes('"' + k + '"') && !content.includes("'" + k + "'")) {
     missingKeys.push(k);
  }
}

console.log('Missing in ko.ts:', missingKeys.length);

if (missingKeys.length > 0) {
  let insertStr = '';
  for (const k of missingKeys) {
     let safeVal = dict[k].replace(/"/g, '\\"').replace(/\n/g, ' ');
     insertStr += '    "' + k + '": "' + safeVal + '",\n';
  }
  
  const lastIdx = content.lastIndexOf('};');
  if (lastIdx !== -1) {
    // Add comma fix if necessary
    content = content.slice(0, lastIdx).replace(/\}\s*$/, '},\n') + insertStr + content.slice(lastIdx);
    fs.writeFileSync(koFilePath, content, 'utf8');
    console.log('Pushed ' + missingKeys.length + ' base keys to ko.ts to stop EN fallback.');
  }
}
