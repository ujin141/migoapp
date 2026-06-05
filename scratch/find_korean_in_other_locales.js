import fs from 'fs';

const files = [
  'src/i18n/checkinLocales.ts',
  'src/i18n/filterLocales.ts',
  'src/i18n/gdfLocales.ts',
  'src/i18n/mapLocales.ts',
  'src/i18n/migoPlusLocales.ts',
  'src/i18n/retentionLocales.ts',
  'src/i18n/tierLocales.ts'
];
const koreanRegex = /[\uac00-\ud7a3]/;

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`${file} does not exist.`);
    return;
  }
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  let found = 0;
  lines.forEach((line, idx) => {
    // Look for lang keys that are not 'ko' and have Korean
    // e.g. en: "...", ja: "...", zh: "..." containing Hangul
    // We can check if the line contains a non-ko language key or is in a non-ko block.
    // Let's do a simple check: if the line has Hangul AND (contains en: or ja: or zh: or is in a block for that language)
    const match = line.match(/^\s*(["']?)([a-zA-Z\-]{2,5})\1\s*:\s*["'`].*?[\uac00-\ud7a3]/);
    if (match && match[2] !== 'ko') {
      console.log(`[${file}] Line ${idx + 1}: ${line.trim()}`);
      found++;
    }
  });
  
  console.log(`==> ${file} has ${found} inline non-ko key-value lines with Korean characters.\n`);
});
