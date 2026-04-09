import fs from 'fs';
import path from 'path';

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllFiles(fullPath, exts));
        } else if (exts.includes(path.extname(fullPath))) {
            results.push(fullPath);
        }
    });
    return results;
}

const koPath = path.join(process.cwd(), 'src', 'i18n', 'locales', 'ko.ts');
let koStr = fs.readFileSync(koPath, 'utf8');
const startIdx = koStr.indexOf('{');
const endIdx = koStr.lastIndexOf('}');
const jsonStr = koStr.substring(startIdx, endIdx + 1);
const koObj = (new Function(`return (${jsonStr})`))();

// Helper to check if a key exists in an object
function hasKey(obj, pathStr) {
    const parts = pathStr.split('.');
    let current = obj;
    for (const part of parts) {
        if (current == null || current[part] === undefined) return false;
        current = current[part];
    }
    return true;
}

const srcPath = path.join(process.cwd(), 'src');
const allFiles = getAllFiles(srcPath);

const allTKeys = new Set();
const regexps = [
  /t\(\s*['"]([^'"]+)['"]/g,
  /t\(\s*`([^`]+)`/g,
  /i18n\.t\(\s*['"]([^'"]+)['"]/g
];

allFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    for (const r of regexps) {
        let match;
        while ((match = r.exec(content)) !== null) {
            allTKeys.add(match[1]);
        }
    }
});

const missing = [];
for (const key of allTKeys) {
    if (!hasKey(koObj, key) && !key.includes('${') && !key.startsWith('auto.') && !key.includes(' ') && !key.includes('/')) {
        missing.push(key);
    }
}

fs.writeFileSync('brute_missing.json', JSON.stringify(missing, null, 2), 'utf8');
console.log(`Found ${missing.length} completely missing keys.`);
if (missing.length > 0) {
    console.log("Missing keys:");
    console.log(missing.join(', '));
}
