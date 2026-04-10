import * as fs from 'fs';
import * as path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walkDir('./src');
let updatedCount = 0;

for (const f of files) {
    let cnt = fs.readFileSync(f, 'utf8');
    let orig = cnt;
    
    cnt = cnt.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
        const hasOverflow = classes.includes('overflow-y-auto') || classes.includes('overflow-y-scroll') || 
                            classes.includes('overflow-x-auto') || classes.includes('overflow-x-scroll');
        const hasTruncate = /\btruncate\b/.test(classes);

        if (hasOverflow && hasTruncate) {
            let newClasses = classes.replace(/\btruncate\b/g, '').replace(/\s+/g, ' ').trim();
            return `className=${quote}${newClasses}${quote}`;
        }
        return match;
    });

    if (orig !== cnt) {
        fs.writeFileSync(f, cnt, 'utf8');
        console.log(`Fixed: ${f}`);
        updatedCount++;
    }
}

console.log(`Total files updated: ${updatedCount}`);
