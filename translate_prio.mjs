import fs from 'fs';
import path from 'path';
import https from 'https';

const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const koreanRegex = /[가-힣]/;

function parseTsObject(content) {
  try {
    const jsonStr = content.replace(/export default \w+;?/, '').replace(/const \w+ = /, '').replace(/;?\s*$/, '').trim();
    return (new Function(`return ${jsonStr}`))();
  } catch (e) { return {}; }
}

function stringifyTsObject(obj, varName) {
  return `const ${varName} = ${JSON.stringify(obj, null, 2)};\nexport default ${varName};\n`;
}

function findMissing(koObj, targetObj, prefix = '') {
  let missing = [];
  for (const [key, value] of Object.entries(koObj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const targetValue = targetObj[key];
    if (targetValue === undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        targetObj[key] = {};
        missing = missing.concat(findMissing(value, targetObj[key], fullPath));
      } else {
        missing.push({ path: fullPath, text: value, parent: targetObj, key });
      }
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      missing = missing.concat(findMissing(value, targetValue, fullPath));
    } else if (typeof value === 'string' && typeof targetValue === 'string') {
      if (value === targetValue && koreanRegex.test(value)) {
        missing.push({ path: fullPath, text: value, parent: targetObj, key });
      }
    }
  }
  return missing;
}

function translateBatchChrome(texts, targetLang) {
  return new Promise((resolve) => {
    let glang = targetLang.replace('-r', '-');
    if (glang === 'in') glang = 'id';
    if (glang === 'iw') glang = 'he';
    if (glang === 'tl') glang = 'tl';
    if (glang === 'zh') glang = 'zh-CN';
    
    const joined = texts.join('\n\n_|||_\n\n');
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=ko&tl=${glang}&q=${encodeURIComponent(joined)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const translatedFull = json[0] || joined;
          const results = translatedFull.split('_|||_').map(s => s.trim());
          resolve(results.length === texts.length ? results : texts);
        } catch (e) { resolve(texts); }
      });
    }).on('error', () => resolve(texts));
  });
}

async function run() {
  const koContent = fs.readFileSync(path.join(localesDir, 'ko.ts'), 'utf8');
  const koObj = parseTsObject(koContent);
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts') && f !== 'ko.ts').map(f => f.replace('.ts', ''));
  
  // Prioritize
  const prio = ['de', 'en', 'ja', 'es', 'zh-CN', 'zh-TW', 'fr', 'pt', 'ru', 'vi'];
  const sortedFiles = files.sort((a,b) => {
    const aPrio = prio.includes(a);
    const bPrio = prio.includes(b);
    if (aPrio && !bPrio) return -1;
    if (!aPrio && bPrio) return 1;
    return 0;
  });

  for (const lang of sortedFiles) {
    const file = lang + '.ts';
    const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
    const obj = parseTsObject(content);
    const missing = findMissing(koObj, obj);
    
    if (missing.length === 0) continue;
    
    console.log(`[${lang}] Found ${missing.length} un-translated keys.`);
    const toTranslate = missing.map(m => {
      if (typeof m.text === 'string') return m.text;
      if (Array.isArray(m.text)) return JSON.stringify(m.text);
      return '';
    }).filter(t => t);
    
    if (toTranslate.length > 0) {
      let currentBatch = [], currentLen = 0, translatedResults = [];
      for (const t of toTranslate) {
        if (currentLen + t.length > 3000) {
          translatedResults = translatedResults.concat(await translateBatchChrome(currentBatch, lang));
          currentBatch = []; currentLen = 0;
          await new Promise(r => setTimeout(r, 200));
        }
        currentBatch.push(t); currentLen += t.length;
      }
      if (currentBatch.length > 0) {
        translatedResults = translatedResults.concat(await translateBatchChrome(currentBatch, lang));
      }
      
      let tIdx = 0;
      for (const m of missing) {
        if (typeof m.text === 'string') {
          let trans = translatedResults[tIdx] || m.text;
          if (trans.startsWith('"') && trans.endsWith('"') && !m.text.startsWith('"')) trans = trans.substring(1, trans.length-1);
          m.parent[m.key] = trans; tIdx++;
        } else if (Array.isArray(m.text)) {
           try { m.parent[m.key] = JSON.parse(translatedResults[tIdx]); } catch(e) { m.parent[m.key] = m.text; }
           tIdx++;
        }
      }
      fs.writeFileSync(path.join(localesDir, file), stringifyTsObject(obj, lang), 'utf8');
      console.log(`[${lang}] Patched successfully.`);
    }
  }
}
run();
