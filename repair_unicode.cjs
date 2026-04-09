const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/i18n/locales/*.ts');

let removed = 0;

files.forEach(f => {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    const newLines = lines.filter((l, i) => {
        const invalidU = /\\u(?![0-9a-fA-F]{4})/i;
        if (invalidU.test(l)) {
            console.log(`Removed from ${f}:${i+1} -> ${l.trim()}`);
            return false;
        }
        return true;
    });
    if (newLines.length !== lines.length) {
        fs.writeFileSync(f, newLines.join('\n'), 'utf8');
        removed += lines.length - newLines.length;
    }
});
console.log('Removed', removed, 'lines with invalid unicode escapes.');
