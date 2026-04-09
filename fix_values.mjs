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

// Load KO to map references
const koContent = fs.readFileSync(path.join(localesDir, 'ko.ts'), 'utf8');
const koObj = parseTsObject(koContent);

let modifiedCount = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
  const obj = parseTsObject(content);
  if (!obj || !obj.auto) continue;
  
  let changed = false;

  for (const [k, v] of Object.entries(obj.auto)) {
    // We only resolve if the KO mapping says it's a pointer.
    const koVal = koObj.auto ? koObj.auto[k] : undefined;
    if (typeof koVal === 'string' && koVal.startsWith('auto.')) {
      // Find the true target key in KO
      let targetKey = koVal.substring(5);
      let deepKoVal = koObj.auto[targetKey];
      
      // Resolve deeply if needed
      while (typeof deepKoVal === 'string' && deepKoVal.startsWith('auto.')) {
        targetKey = deepKoVal.substring(5);
        deepKoVal = koObj.auto[targetKey];
      }

      // If we found a valid deep target, map current language to it
      if (typeof deepKoVal === 'string' && !deepKoVal.startsWith('auto.')) {
        const trueLangVal = obj.auto[targetKey];
        if (trueLangVal && !trueLangVal.startsWith('auto.')) {
          obj.auto[k] = trueLangVal;
          changed = true;
        } else if (koObj.auto[targetKey]) {
          // If translation is missing in this lang, fallback to KO (or maybe it IS translated manually)
          // Wait, if it's missing or says "auto.z...", we fallback to whatever we can find or let i18next fallback.
           // Actually, other langs might have translated the targetKey correctly.
           // e.g., en.auto['z_어드민대시보드_539'] = "Admin Dashboard"
        }
      }
    } 
    // What if KO is NOT "auto." but this language IS "auto."?
    // It shouldn't happen, but let's clean it up just in case:
    else if (typeof v === 'string' && v.startsWith('auto.')) {
        // This language has a corrupted translation but KO doesn't point to a target?
        // Let's rely on KO to find the target.
    }
  }

  // Double pass to catch any remaining self-references in this file natively
  for (const [k, v] of Object.entries(obj.auto)) {
      if (typeof v === 'string' && v.startsWith('auto.z_')) {
          // Try to look up directly in this file
          const directTarget = v.substring(5);
          const directVal = obj.auto[directTarget];
          if (directVal && !directVal.startsWith('auto.')) {
              obj.auto[k] = directVal;
              changed = true;
          }
      }
  }

  if (changed) {
    const lang = file.replace('.ts', '');
    fs.writeFileSync(path.join(localesDir, file), stringifyTsObject(obj, lang), 'utf8');
    modifiedCount++;
  }
}

console.log(`Successfully resolved deep translation values in ${modifiedCount} locale files.`);
