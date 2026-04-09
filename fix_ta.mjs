import fs from 'fs';

// Direct byte-level fix for ta.ts:4036
const filePath = './src/i18n/locales/ta.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find the exact line
const lines = content.split('\n');
let fixed = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('개더무료vsPlus_1497')) {
    console.log('Found at line', i+1, ':', JSON.stringify(lines[i]));
    // Replace the entire line
    lines[i] = '    "z_개더무료vsPlus_1497": "More \\u2192 Check the Free vs Plus tab",';
    console.log('Replaced with:', lines[i]);
    fixed = true;
    break;
  }
}

if (fixed) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Saved ta.ts');
} else {
  console.log('ERROR: Could not find the line');
}

// Verify
const v = fs.readFileSync(filePath, 'utf8');
const vlines = v.split('\n');
for (let i = 0; i < vlines.length; i++) {
  if (vlines[i].includes('개더무료vsPlus_1497')) {
    console.log('Verified line', i+1, ':', JSON.stringify(vlines[i]));
  }
}
