// clean_locales.cjs
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = 'src/i18n/locales';

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts' && f !== 'en.ts');

for (const file of files) {
  const fp = path.join(LOCALES_DIR, file);
  const content = fs.readFileSync(fp, 'utf8');
  
  const lines = content.split('\n');
  const output = [];
  
  let depth = 0;
  let inSkipBlock = false;
  let skippedBlocks = 0;
  
  const seenRootKeys = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Quick trick to ignore purely string content from brace counting:
    const cleanLine = line.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '');
    const openCount = (cleanLine.match(/\{/g) || []).length;
    const closeCount = (cleanLine.match(/\}/g) || []).length;
    
    if (depth === 1 && !inSkipBlock) {
      const match = line.match(/^\s*"([^"]+)"\s*:\s*\{/);
      if (match) {
        const key = match[1];
        if (['map', 'match', 'chat', 'discover'].includes(key)) {
          if (seenRootKeys.has(key)) {
            inSkipBlock = true;
            skippedBlocks++;
          } else {
            seenRootKeys.add(key);
          }
        }
      }
      
      const flatMatch = line.match(/^\s*"([^"]+)\.([^"]+)"\s*:/);
      if (flatMatch) {
         const keyPrefix = flatMatch[1];
         if (['map', 'match', 'chat', 'discover'].includes(keyPrefix)) {
            // skip line
            skippedBlocks++;
            continue;
         }
      }
      
      const strMatch = line.match(/^\s*"([^"]+)"\s*:\s*"/);
      if (strMatch) {
         const key = strMatch[1];
         if (['map', 'match', 'chat', 'discover'].includes(key)) {
            if (seenRootKeys.has(key)) {
               skippedBlocks++;
               continue; 
            } else {
               seenRootKeys.add(key);
            }
         }
      }
    }
    
    // Depth update must use the cleanLine to avoid {{tags}} ruining depth
    // WAIT, what if depth was ruined earlier?
    // Let's also check if we are in a skip block and want to exit
    if (inSkipBlock) {
      depth += (openCount - closeCount);
      if (depth <= 1) { // We exited the block!
         inSkipBlock = false;
         depth = 1; // force correct depth
      }
      continue;
    }
    
    // Standard processing
    output.push(line);
    depth += (openCount - closeCount);
  }
  
  const newContent = output.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(fp, newContent, 'utf8');
    console.log(`Cleaned duplicates in ${file} (removed ${skippedBlocks} items)`);
  }
}
console.log('Cleanup script finished.');
