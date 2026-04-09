const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/i18n/locales/*.ts');

let totalDups = 0;

files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const seenKeys = new Map(); 
    const toRemove = new Set();
    
    lines.forEach((line, i) => {
        const trimmed = line.trim();
        const matchQuote = trimmed.match(/^["']([^"']+)["']\s*:/);
        const matchNoQuote = trimmed.match(/^([a-zA-Z0-9.\-_]+)\s*:/);
        const match = matchQuote || matchNoQuote;
        
        if (match) {
            const key = match[1];
            if (seenKeys.has(key)) {
                // Add the old one to the remove set (keep latest translation)
                toRemove.add(seenKeys.get(key));
            }
            seenKeys.set(key, i);
        }
    });

    const newLines = lines.filter((_, i) => !toRemove.has(i));

    if (newLines.length !== lines.length) {
        fs.writeFileSync(f, newLines.join('\n'), 'utf8');
        console.log(`Deduped ${f} - removed ${lines.length - newLines.length} duplicates`);
        totalDups += lines.length - newLines.length;
    }
});
console.log('Total duplicates removed:', totalDups);
