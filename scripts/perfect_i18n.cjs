const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

const hasKorean = (s) => /[\uAC00-\uD7AF\u3131-\u3163]/.test(s);

// Parse a locale file and return { keysInOrder: string[], data: Record<string, {val: string, line: number, isLast: boolean}>, fullContent: string }
function parseLocale(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const data = {};
  const keysInOrder = [];
  
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)"([^"]+)"\s*:\s*"([^"]*)"(,?\s*)$/);
    if (m) {
      data[m[2]] = { 
        val: m[3], 
        line: i, 
        prefix: m[1], 
        suffix: m[4] 
      };
      keysInOrder.push(m[2]);
    }
  }
  return { data, keysInOrder, lines, fullContent: content };
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Split array into chunks
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function translateBatch(texts, lang) {
  if (texts.length === 0) return [];
  // Convert zh to zh-cn, he to iw for google translate
  const gLang = lang === 'zh' ? 'zh-cn' : lang === 'he' ? 'iw' : lang;
  
  const textStr = texts.join('\n|||\n');
  try {
    const res = await translate(textStr, { to: gLang });
    const split = res.split(/\n?\s*\|\|\|\s*\n?/);
    if (split.length !== texts.length) {
      console.log(`[Warning] Length mismatch in translation for ${lang}. Expected ${texts.length}, got ${split.length}`);
      // Fallback: return original texts if messed up, but ideally handle properly
      // If mismatch, try translating one by one (fallback)
      console.log('Falling back to individual translation...');
      const fallbackRes = [];
      for (const t of texts) {
        try {
          const r = await translate(t, { to: gLang });
          fallbackRes.push(r);
        } catch (e) {
          fallbackRes.push(t); // keep original on error
        }
        await delay(100);
      }
      return fallbackRes;
    }
    return split.map(s => s.trim());
  } catch (e) {
    console.log(`[Error] Translation failed for ${lang}:`, e.message);
    // Return original English texts if translation fails completely
    return texts;
  }
}

async function main() {
  const localesDir = path.join(__dirname, '../src/i18n/locales');
  const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));
  
  const enObj = parseLocale(path.join(localesDir, 'en.ts'));
  console.log(`Parsed en.ts: ${enObj.keysInOrder.length} keys`);
  
  for (const file of files) {
    if (file === 'en.ts' || file === 'ko.ts') continue;
    const lang = file.replace('.ts', '');
    const filePath = path.join(localesDir, file);
    
    const locObj = parseLocale(filePath);
    
    // Find missing keys
    const missingKeys = [];
    const keysWithKorean = [];
    
    for (const enKey of enObj.keysInOrder) {
      if (!locObj.data[enKey]) {
        // Exclude 'auto.*' keys from being forcefully injected if they are just logging keys, 
        // BUT the user wants PERFECT sync. Let's just sync everything that is not 'auto.*' with Korean keys
        // Wait, auto keys with Korean in the KEY name shouldn't be added to other files if they are not needed.
        // Actually, let's sync ALL missing keys to ensure exact matching and no fallbacks.
        missingKeys.push(enKey);
      }
    }
    
    for (const key of locObj.keysInOrder) {
      if (hasKorean(locObj.data[key].val) && !key.startsWith('auto.')) {
        keysWithKorean.push(key);
      }
    }
    
    if (missingKeys.length === 0 && keysWithKorean.length === 0) {
      console.log(`[${lang}] Perfect. No missing keys or Korean values.`);
      continue;
    }
    
    console.log(`\n[${lang}] Missing: ${missingKeys.length}, HasKorean: ${keysWithKorean.length}`);
    
    const keysToTranslate = [...missingKeys, ...keysWithKorean];
    const textsToTranslate = keysToTranslate.map(k => enObj.data[k] ? enObj.data[k].val : '');
    
    // Batch translate (max 50 strings per batch)
    let translatedTexts = [];
    const chunks = chunkArray(textsToTranslate, 50);
    for (let i = 0; i < chunks.length; i++) {
      console.log(`  Translating batch ${i+1}/${chunks.length} for ${lang}...`);
      const res = await translateBatch(chunks[i], lang);
      translatedTexts = translatedTexts.concat(res);
      await delay(500); // polite delay
    }
    
    if (translatedTexts.length !== keysToTranslate.length) {
      console.log(`  [Error] Translation array size mismatch. Skipping ${lang}.`);
      continue;
    }
    
    // Apply changes
    const lines = [...locObj.lines];
    
    // 1. Replace existing Korean values
    for (let i = 0; i < keysWithKorean.length; i++) {
      const key = keysWithKorean[i];
      const translatedVal = translatedTexts[missingKeys.length + i].replace(/"/g, '\\"');
      const lineIdx = locObj.data[key].line;
      lines[lineIdx] = `${locObj.data[key].prefix}"${key}": "${translatedVal}"${locObj.data[key].suffix}`;
    }
    
    // 2. Append missing keys at the end
    if (missingKeys.length > 0) {
      let lastBraceIdx = -1;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('}')) {
          lastBraceIdx = i;
          break;
        }
      }
      
      if (lastBraceIdx !== -1) {
        // Ensure previous line has comma
        for (let i = lastBraceIdx - 1; i >= 0; i--) {
          if (lines[i].trim().length > 0 && lines[i].includes(':')) {
            if (!lines[i].endsWith(',')) {
              lines[i] += ',';
            }
            break;
          }
        }
        
        const newLines = [];
        for (let i = 0; i < missingKeys.length; i++) {
          const key = missingKeys[i];
          const translatedVal = translatedTexts[i].replace(/"/g, '\\"');
          const isLast = (i === missingKeys.length - 1);
          newLines.push(`  "${key}": "${translatedVal}"${isLast ? '' : ','}`);
        }
        
        lines.splice(lastBraceIdx, 0, ...newLines);
      }
    }
    
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`  [${lang}] Saved ${missingKeys.length} appended, ${keysWithKorean.length} replaced.`);
  }
}

main().catch(console.error);
