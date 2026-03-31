import fs from 'fs';

// Fix 1: ta.ts broken string literal
let ta = fs.readFileSync('./src/i18n/locales/ta.ts', 'utf8');
const badStr = `"z_개더무료vsPlus_1497": "More → Check the \u201cFree vs Plus\u201d tab\\"무료 vs Plus\\\\" 탭 확인"`;
const goodStr = `"z_개더무료vsPlus_1497": "More → Check the Free vs Plus tab"`;

// Replace all problematic variants
ta = ta.replace(/("z_개더무료vsPlus_1497":\s*)"[^"]*?(무료 vs Plus|Free vs Plus)[^"]*?"/, '$1"More → Check the Free vs Plus tab"');

// Also search raw bytes
const idx = ta.indexOf('개더무료vsPlus_1497');
if (idx >= 0) {
  const lineStart = ta.lastIndexOf('\n', idx) + 1;
  const lineEnd = ta.indexOf('\n', idx);
  const line = ta.substring(lineStart, lineEnd);
  console.log('Current line:', JSON.stringify(line));
  if (line.includes('무료')) {
    const fixedLine = '    "z_개더무료vsPlus_1497": "More \\u2192 Check the Free vs Plus tab",';
    ta = ta.substring(0, lineStart) + fixedLine + ta.substring(lineEnd);
    console.log('Fixed ta.ts line 4036');
  }
}

fs.writeFileSync('./src/i18n/locales/ta.ts', ta, 'utf8');

// Fix 2: ko.ts duplicate notif key
let ko = fs.readFileSync('./src/i18n/locales/ko.ts', 'utf8');
const notifCount = (ko.match(/"notif":/g) || []).length;
console.log('notif occurrences in ko.ts:', notifCount);

if (notifCount > 1) {
  // Find the second occurrence and remove it along with its block
  let firstIdx = ko.indexOf('"notif":');
  let secondIdx = ko.indexOf('"notif":', firstIdx + 1);
  
  if (secondIdx >= 0) {
    // Find start of the line (go back to find the opening of this key)
    const lineStart = ko.lastIndexOf('\n', secondIdx) + 1;
    
    // Find the closing of this notif block
    let depth = 0;
    let braceStart = ko.indexOf('{', secondIdx);
    let braceEnd = braceStart;
    for (let i = braceStart; i < ko.length; i++) {
      if (ko[i] === '{') depth++;
      else if (ko[i] === '}') { depth--; if (depth === 0) { braceEnd = i; break; } }
    }
    
    // Remove from lineStart to braceEnd + possible comma + newline
    let removeEnd = braceEnd + 1;
    while (removeEnd < ko.length && (ko[removeEnd] === ',' || ko[removeEnd] === '\n' || ko[removeEnd] === '\r')) {
      removeEnd++;
    }
    
    const removed = ko.substring(lineStart, braceEnd + 2);
    console.log('Removing duplicate notif block starting with:', removed.substring(0, 100));
    ko = ko.substring(0, lineStart) + ko.substring(removeEnd);
    fs.writeFileSync('./src/i18n/locales/ko.ts', ko, 'utf8');
    console.log('Fixed ko.ts duplicate notif key');
  }
}
