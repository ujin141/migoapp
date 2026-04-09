import fs from 'fs';
const extracted = JSON.parse(fs.readFileSync('extracted_babel.json', 'utf8'));

let koTs = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');

const entries = Object.entries(extracted).map(([k, v]) => `    "${k}": ${JSON.stringify(v)},`).join('\n');
const injection = `  "auto2": {\n${entries}\n  }\n`;

const lastBraceIdx = koTs.lastIndexOf('}');
// Find the '}' that closes the ko object. Usually it's the second to last '}' if ends with `}; export default ko;`
// We can just use string operations to find the actual export line.
const exportIdx = koTs.indexOf('export default ko;');
if (exportIdx !== -1) {
    const beforeExport = koTs.substring(0, exportIdx);
    const braceIdx = beforeExport.lastIndexOf('}');
    // The brace closed the ko object.
    
    // Check if there's a comma before the brace
    let modified = beforeExport.substring(0, braceIdx).trimEnd();
    if (!modified.endsWith(',')) {
        modified += ',';
    }
    
    const finalStr = modified + '\n' + injection + '};\nexport default ko;\n';
    fs.writeFileSync('src/i18n/locales/ko.ts', finalStr, 'utf8');
    console.log("Injected auto2 successfully.");
} else {
    console.log("export default ko; not found");
}
