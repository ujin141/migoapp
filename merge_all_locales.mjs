import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  const fullPath = path.join(localesDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let match = content.match(/export\s+default\s+[A-Za-z0-9_]+;\s*$/);
  if (!match) continue;
  
  let exportStatement = match[0];
  let objectEndStr = content.substring(0, match.index).trimEnd();
  if (objectEndStr.endsWith(';')) objectEndStr = objectEndStr.substring(0, objectEndStr.length - 1).trimEnd();
  
  const startIdx = objectEndStr.indexOf('{');
  if (startIdx === -1) continue;
  
  const jsonStr = objectEndStr.substring(startIdx);
  try {
    const obj = (new Function(`return (${jsonStr})`))();
    if (obj.auto && obj.auto2) {
      obj.auto = { ...obj.auto, ...obj.auto2 };
      delete obj.auto2;
      
      const varName = exportStatement.replace(/export\s+default\s+/, '').replace(';', '').trim();
      const finalContent = `const ${varName} = ${JSON.stringify(obj, null, 2)};\nexport default ${varName};\n`;
      fs.writeFileSync(fullPath, finalContent, 'utf8');
      console.log(`Merged auto2 into auto for ${file}`);
    }
  } catch (e) {
    console.error(`Failed to parse ${file}: ${e.message}`);
  }
}
