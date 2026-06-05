import fs from 'fs';

const content = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
const lines = content.split('\n');
const koreanRegex = /[\uac00-\ud7a3]/;

lines.forEach((line, idx) => {
  if (koreanRegex.test(line)) {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) return;
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
