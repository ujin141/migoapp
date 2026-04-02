import fs from 'fs';
import path from 'path';
import https from 'https';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');

function parseTsObject(content) {
  try {
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    const jsonStr = content.substring(startIdx, endIdx + 1);
    return (new Function(`return (${jsonStr})`))();
  } catch (e) {
    console.error("Parse Error:", e.stack);
    return {};
  }
}

function stringifyTsObject(obj, varName) {
  return `const ${varName} = ${JSON.stringify(obj, null, 2)};\nexport default ${varName};\n`;
}

function translateBatchChrome(texts, targetLang) {
  return new Promise((resolve) => {
    let glang = targetLang.replace('-r', '-');
    if (glang === 'in') glang = 'id';
    if (glang === 'iw') glang = 'he';
    if (glang === 'tl') glang = 'tl';
    if (glang === 'zh') glang = 'zh-CN';
    
    const joined = texts.join('\n\n_|||_\n\n');
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=${glang}&q=${encodeURIComponent(joined)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const translatedFull = json[0] || joined;
          const results = translatedFull.split('_|||_').map(s => s.trim());
          if (results.length === texts.length) resolve(results);
          else resolve(texts);
        } catch (e) {
          resolve(texts);
        }
      });
    }).on('error', () => resolve(texts));
  });
}

function flattenObj(obj, prefix = '') {
  let flat = {};
  for(let key in obj) {
    if(typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(flat, flattenObj(obj[key], prefix + key + '.'));
    } else {
      flat[prefix + key] = obj[key];
    }
  }
  return flat;
}

function unflattenObj(flat) {
  let obj = {};
  for(let key in flat) {
    let parts = key.split('.');
    let current = obj;
    for(let i=0; i<parts.length-1; i++) {
        current[parts[i]] = current[parts[i]] || {};
        current = current[parts[i]];
    }
    current[parts[parts.length-1]] = flat[key];
  }
  return obj;
}

async function run() {
  const enContent = fs.readFileSync(path.join(localesDir, 'en.ts'), 'utf8');
  const enObj = parseTsObject(enContent);
  const instantFlat = flattenObj(enObj.instant);
  
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') && f !== 'en.ts' && f !== 'ko.ts');
  
  const CONCURRENCY = 4; // reduced to prevent rate limiting
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const chunk = files.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async file => {
      const lang = file.replace('.ts', '');
      const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
      const obj = parseTsObject(content);
      
      const keys = Object.keys(instantFlat);
      const values = Object.values(instantFlat);
      
      const translatedVals = await translateBatchChrome(values, lang);
      
      let newFlat = {};
      keys.forEach((k, idx) => {
        let t = translatedVals[idx] || values[idx];
        if (t.startsWith('"') && t.endsWith('"') && !values[idx].startsWith('"')) {
           t = t.substring(1, t.length-1);
        }
        // Protect mustaches {{ }} since translate messes it up sometimes
        if (values[idx].includes('{{place}}')) t = t.replace(/\{\s*\{\s*place\s*\}\s*\}/g, '{{place}}');
        if (values[idx].includes('{{time}}')) t = t.replace(/\{\s*\{\s*time\s*\}\s*\}/g, '{{time}}');
        newFlat[k] = t;
      });
      
      obj.instant = unflattenObj(newFlat);
      
      fs.writeFileSync(path.join(localesDir, file), stringifyTsObject(obj, lang), 'utf8');
      console.log(`[${lang}] translated instant block.`);
    }));
    await new Promise(r => setTimeout(r, 400));
  }
  console.log("All instant filters translated!");
}

run();
