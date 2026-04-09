const fs = require('fs');

function fixFiles() {
  const dir = 'src/i18n/locales';
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (!f.endsWith('.ts')) continue;
    const fp = dir + '/' + f;
    let content = fs.readFileSync(fp, 'utf8');
    
    // Replace any \u that doesn't have 4 hex digits right after it with just 'u'.
    // e.g. \uA08 -> uA08, \u84. -> u84.
    let fixed = content.replace(/\\u(?![0-9a-fA-F]{4})/g, 'u');
    
    if (fixed !== content) {
      fs.writeFileSync(fp, fixed, 'utf8');
      console.log('Sanitized invalid escape in', f);
    }
  }
}
fixFiles();
