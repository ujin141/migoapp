const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/i18n/locales/*.ts');

let added = 0;

files.forEach(f => {
    let lines = fs.readFileSync(f, 'utf8').split('\n');
    let changed = false;

    for (let i = 0; i < lines.length - 1; i++) {
        let trimmed = lines[i].trimEnd();
        // Check if the line ends with a string quote
        if (trimmed.endsWith('"') || trimmed.endsWith("'") || trimmed.endsWith('`')) {
            // Find the next non-empty line
            let nextLine = '';
            for (let j = i + 1; j < lines.length; j++) {
               if (lines[j].trim() !== '') {
                  nextLine = lines[j].trim();
                  break;
               }
            }
            // If the next line doesn't start with `}`, we must have a comma.
            if (nextLine && !nextLine.startsWith('}')) {
                lines[i] = trimmed + ',';
                changed = true;
                added++;
            }
        }
        
        // Also if line ends with } but next line is a key, it needs a comma
        if (trimmed.endsWith('}')) {
            let nextLine = '';
            for (let j = i + 1; j < lines.length; j++) {
               if (lines[j].trim() !== '') {
                  nextLine = lines[j].trim();
                  break;
               }
            }
            if (nextLine && !nextLine.startsWith('}') && nextLine.includes(':')) {
                lines[i] = trimmed + ',';
                changed = true;
                added++;
            }
        }
    }
    
    if (changed) {
        fs.writeFileSync(f, lines.join('\n'), 'utf8');
    }
});
console.log('Added', added, 'missing commas.');
