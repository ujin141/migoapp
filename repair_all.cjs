const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/i18n/locales/*.ts');

let totalBadLines = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  const newLines = lines.filter((line, i) => {
    const trimmed = line.trim();
    
    // Keep legitimate boilerplate
    if (!trimmed || trimmed.startsWith('//') || trimmed === 'export default {' || trimmed === '};' || trimmed.startsWith('import ')) {
      return true;
    }
    
    // Check key format
    // A standard line looks like: "key.name": "value",
    // We match the key part before the colon
    const matchQuote = trimmed.match(/^["']([^"']+)["']\s*(:|,)/);
    const matchNoQuote = trimmed.match(/^([a-zA-Z0-9.\-_]+)\s*(:|,)/);
    
    const match = matchQuote || matchNoQuote;
    
    if (!match) {
      // If it doesn't match standard key structure at all but has content, it's likely a broken injection
      // e.g. "auto.t_0047", `부스팅 ...
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        console.log(`[Bad Line] ${file}:${i+1} -> ${trimmed}`);
        return false;
      }
      return true;
    }
    
    const keyStr = match[1];
    const separator = match[2];
    
    // If separator is a comma instead of colon, syntax error
    if (separator !== ':') {
      console.log(`[Bad Separator] ${file}:${i+1} -> ${trimmed}`);
      return false;
    }
    
    // If key contains spaces, parentheses, asterisks, brackets -> invalid key
    if (/[ \(\)\*\=\[\]\{\}\/]/.test(keyStr)) {
      console.log(`[Bad Key Format] ${file}:${i+1} -> ${trimmed}`);
      return false;
    }

    return true;
  });

  if (newLines.length !== lines.length) {
    fs.writeFileSync(file, newLines.join('\n'), 'utf8');
    totalBadLines += (lines.length - newLines.length);
    console.log(`Repaired ${file} (removed ${lines.length - newLines.length} lines)`);
  }
});

console.log(`\nAll done. Removed a total of ${totalBadLines} broken entries from locale files.`);
