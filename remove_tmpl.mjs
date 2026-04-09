import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

function parseTsObject(content) {
  try {
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    const jsonStr = content.substring(startIdx, endIdx + 1);
    return (new Function(`return (${jsonStr})`))();
  } catch (e) {
    console.error("Parse Error:", e.message);
    return null;
  }
}

function stringifyTsObject(obj, varName) {
  return `const ${varName} = ${JSON.stringify(obj, null, 2)};\nexport default ${varName};\n`;
}

let removedCount = 0;
let modifiedFiles = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
  const obj = parseTsObject(content);
  if (!obj || !obj.auto) continue;
  
  let changed = false;

  for (const [k, v] of Object.entries(obj.auto)) {
    // If the value is literally the placeholder or points to something with the placeholder
    if (v === 'TEMPLATE_LITERAL_MAPPED' || (typeof v === 'string' && v.includes('TEMPLATE_LITERAL_MAPPED'))) {
        delete obj.auto[k];
        removedCount++;
        changed = true;
    }
  }

  // Also check at root level just in case
  for (const [k, v] of Object.entries(obj)) {
    if (k !== 'auto' && (v === 'TEMPLATE_LITERAL_MAPPED' || (typeof v === 'string' && v.includes('TEMPLATE_LITERAL_MAPPED')))) {
        delete obj[k];
        removedCount++;
        changed = true;
    }
  }

  if (changed) {
    const lang = file.replace('.ts', '');
    fs.writeFileSync(path.join(localesDir, file), stringifyTsObject(obj, lang), 'utf8');
    modifiedFiles++;
  }
}

console.log(`Successfully removed ${removedCount} TEMPLATE_LITERAL_MAPPED keys across ${modifiedFiles} locale files.`);
