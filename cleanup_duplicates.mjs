import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));

let totalCleaned = 0;

for (const file of files) {
  const fp = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(fp, 'utf8');
  let startIdx = content.indexOf('{');
  let endIdx = content.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1) {
    let objStr = content.substring(startIdx, endIdx + 1);
    
    // We can't simply JSON.parse because it's JS (keys aren't always quoted, trailing commas, etc.)
    // Wait, let's just use eval. Since it's a TS file with string values, eval is safe enough if wrapped.
    try {
      // Create a safely evaluable string
      let evalStr = `(${objStr})`;
      // Eval to JS object (duplicate keys are automatically resolved by JS, last one wins)
      let parsed = eval(evalStr);
      
      // Serialize back to JSON string with 2 spaces
      let cleanedStr = JSON.stringify(parsed, null, 2);
      
      // Reconstruct file
      let newContent = content.substring(0, startIdx) + cleanedStr + content.substring(endIdx + 1);
      
      if (newContent !== content) {
        fs.writeFileSync(fp, newContent, 'utf8');
        totalCleaned++;
        console.log(`[v] Cleaned duplicate keys in ${file}`);
      }
    } catch (e) {
      console.log(`[!] Could not parse ${file}: ${e.message}`);
    }
  }
}

console.log(`\nDuplicate key cleanup complete. Cleaned ${totalCleaned} files.`);
