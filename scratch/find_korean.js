import fs from 'fs';
const content = fs.readFileSync('src/components/profile/MySajuDetailModal.tsx', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  const match = line.match(/(en|ja|zh)\s*:\s*["'`].*?[\uac00-\ud7a3].*?["'`]/);
  if (match) {
    console.log(`${lineNum}: [${match[1]}] ${line.trim()}`);
  }
});
