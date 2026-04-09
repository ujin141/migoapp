const fs = require('fs');
const files = fs.readdirSync('src/i18n/locales');
let count = 0;
for (const file of files) {
  if (!file.endsWith('.ts')) continue;
  const fp = 'src/i18n/locales/' + file;
  let content = fs.readFileSync(fp, 'utf8');
  let fixed = content.replace(/\}(\r?\n\s*[\"']auto\.)/g, '},$1');
  fixed = fixed.replace(/\"(\r?\n\s*[\"']auto\.)/g, '\",$1');
  
  if (fixed !== content) {
    fs.writeFileSync(fp, fixed);
    count++;
  }
}
console.log('Fixed ' + count + ' corrupted files.');
