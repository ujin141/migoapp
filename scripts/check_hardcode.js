const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');
let totalFiles = 0;
let totalMatches = 0;

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  let fileMatches = 0;
  lines.forEach((line, i) => {
    // Strip comments manually
    let text = line.split('//')[0];
    if (text.trim().startsWith('/*') || text.trim().startsWith('*')) return;
    
    // Check if it has Korean
    if (/[가-힣]/.test(text)) {
      // Check if it's NOT inside a t(...)
      // A simple check: if line DOES NOT contain 't(' and DOES NOT contain 't ('
      if (!text.includes('t(') && !text.includes('t (') && !text.includes('toast(')) {
        console.log(`${file}:${i + 1} - ${text.trim()}`);
        fileMatches++;
      }
    }
  });
  
  if (fileMatches > 0) totalFiles++;
  totalMatches += fileMatches;
});

console.log(`Found ${totalMatches} uncaught hardcoded lines in ${totalFiles} files.`);
