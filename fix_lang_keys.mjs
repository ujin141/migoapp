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

let modifiedFiles = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
  const obj = parseTsObject(content);
  if (!obj) continue;
  
  let changed = false;
  const newObj = {};
  
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('z_') && !k.startsWith('auto.')) {
      newObj['auto.' + k] = v;
      changed = true;
    } else {
      newObj[k] = v;
    }
  }
  
  if (changed) {
    const lang = file.replace('.ts', '');
    fs.writeFileSync(path.join(localesDir, file), stringifyTsObject(newObj, lang), 'utf8');
    modifiedFiles++;
  }
}

console.log(`Successfully fixed "auto." prefix in ${modifiedFiles} locale files.`);
