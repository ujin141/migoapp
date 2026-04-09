const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(localesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Create an array of lines and filter out any line containing the buggy string
  const lines = content.split('\n');
  const filteredLines = lines.filter(line => !line.includes('no_show_count))").eq("status"'));
  
  if (lines.length !== filteredLines.length) {
    fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf8');
    console.log(`Repaired ${file} (removed ${lines.length - filteredLines.length} buggy lines)`);
  }
});
