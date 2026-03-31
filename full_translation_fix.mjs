/**
 * full_translation_fix.mjs
 * Fills ALL missing/Korean-value translation keys in all 49 locale files
 * using the FREE Google Translate endpoint. No API key needed.
 * 
 * Usage: node full_translation_fix.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, 'src/i18n/locales');
const MASTER_FILE = path.join(LOCALES_DIR, 'ko.ts');

// Map file name → Google Translate language code
const LANG_MAP = {
  ar:'ar', bg:'bg', bn:'bn', ca:'ca', cs:'cs', da:'da',
  de:'de', el:'el', en:'en', es:'es', et:'et', fa:'fa',
  fi:'fi', fr:'fr', gu:'gu', he:'iw', hi:'hi', hr:'hr',
  hu:'hu', id:'id', is:'is', it:'it', ja:'ja', kn:'kn',
  lt:'lt', lv:'lv', ml:'ml', mr:'mr', nl:'nl', no:'no',
  pa:'pa', pl:'pl', pt:'pt', ro:'ro', ru:'ru', sk:'sk',
  sl:'sl', sv:'sv', sw:'sw', ta:'ta', te:'te', th:'th',
  tr:'tr', uk:'uk', ur:'ur', vi:'vi', zh:'zh-CN', zu:'zu',
};

const KO_RE = /[\uAC00-\uD7A3]/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Google Translate (free endpoint) ────────────────────────────────────────
async function gtranslate(text, tl, sl = 'ko') {
  if (!text || !text.trim()) return text;
  return new Promise(resolve => {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const req = https.get(url, { timeout: 12000 }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(buf);
          resolve((j[0] || []).map(s => s[0] || '').join('').trim() || text);
        } catch { resolve(text); }
      });
    });
    req.on('error', () => resolve(text));
    req.on('timeout', () => { req.destroy(); resolve(text); });
  });
}

// ─── Eval locale file → JS object ────────────────────────────────────────────
function loadLocale(fp) {
  const src = fs.readFileSync(fp, 'utf8');
  const s = src.indexOf('{'), e = src.lastIndexOf('}');
  if (s < 0 || e < 0) return {};
  try { return eval(`(${src.slice(s, e + 1)})`); }
  catch (err) { console.log(`  [!] Parse error ${path.basename(fp)}: ${err.message}`); return {}; }
}

// ─── Flatten obj → {dot.key: value} ──────────────────────────────────────────
function flatten(obj, pfx = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = pfx ? `${pfx}.${k}` : k;
    if (Array.isArray(v)) {
      out[key] = v; // keep arrays as-is
    } else if (v && typeof v === 'object') {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

// ─── Set nested key on obj ────────────────────────────────────────────────────
function setNested(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// ─── Serialize to TypeScript file ─────────────────────────────────────────────
function toTS(obj, lang) {
  return `const ${lang} = ${JSON.stringify(obj, null, 2)};\nexport default ${lang};\n`;
}

// ═════════════════════════════════════════════════════════════════════════════
console.log('\n[START] Loading master locale (ko.ts)...');
const master = loadLocale(MASTER_FILE);
const masterFlat = flatten(master);
const masterKeys = Object.keys(masterFlat);
console.log(`        Master has ${masterKeys.length} keys.\n`);

const localeFiles = fs.readdirSync(LOCALES_DIR)
  .filter(f => f.endsWith('.ts') && f !== 'ko.ts')
  .sort();

let grandTotal = 0;

for (const fname of localeFiles) {
  const lang = fname.replace('.ts', '');
  const tl = LANG_MAP[lang];
  if (!tl) { console.log(`[SKIP] ${lang}: no language code mapping`); continue; }

  const fp = path.join(LOCALES_DIR, fname);
  const obj = loadLocale(fp);
  const flat = flatten(obj);
  const existing = new Set(Object.keys(flat));

  // Keys that are either missing or still in Korean (for non-ko files)
  const toFill = masterKeys.filter(k => {
    if (!existing.has(k)) return true;
    const val = flat[k];
    if (typeof val === 'string' && KO_RE.test(val)) return true;
    return false;
  });

  if (toFill.length === 0) {
    console.log(`[OK]   ${lang}: nothing to do`);
    continue;
  }

  console.log(`[GO]   ${lang} (${tl}): ${toFill.length} keys to fill...`);
  let done = 0, failed = 0;

  for (let i = 0; i < toFill.length; i++) {
    const key = toFill[i];
    const koVal = masterFlat[key];

    // Arrays: translate each element
    if (Array.isArray(koVal)) {
      const translated = [];
      for (const item of koVal) {
        if (typeof item === 'string') {
          if (lang === 'en' && !KO_RE.test(item)) {
            translated.push(item);
          } else if (KO_RE.test(item)) {
            try {
              translated.push(await gtranslate(item, tl));
              await sleep(60);
            } catch { translated.push(item); }
          } else {
            translated.push(item);
          }
        } else if (item && typeof item === 'object') {
          // object inside array (e.g. payment.methods)
          const translatedObj = {};
          for (const [k2, v2] of Object.entries(item)) {
            if (typeof v2 === 'string' && KO_RE.test(v2)) {
              try {
                translatedObj[k2] = await gtranslate(v2, tl);
                await sleep(60);
              } catch { translatedObj[k2] = v2; }
            } else {
              translatedObj[k2] = v2;
            }
          }
          translated.push(translatedObj);
        } else {
          translated.push(item);
        }
      }
      setNested(obj, key, translated);
      done++;
      continue;
    }

    // String: translate if Korean, or if English and source is Korean
    if (typeof koVal === 'string') {
      let translated = koVal;
      if (lang === 'en' && !KO_RE.test(koVal)) {
        translated = koVal; // already fine for English
      } else if (KO_RE.test(koVal) || lang !== 'en') {
        try {
          translated = await gtranslate(koVal, tl);
          await sleep(60);
          done++;
        } catch { failed++; }
      }
      setNested(obj, key, translated);
    } else {
      setNested(obj, key, koVal);
    }

    // Progress every 25 keys
    if ((i + 1) % 25 === 0) {
      process.stdout.write(`\r    ${i + 1}/${toFill.length} keys translated...`);
    }
  }

  process.stdout.write(`\r    ${toFill.length}/${toFill.length} keys done.         \n`);
  console.log(`       Translated: ${done}  |  Kept original: ${failed}\n`);
  grandTotal += done;

  fs.writeFileSync(fp, toTS(obj, lang), 'utf8');
  await sleep(300); // pause between languages
}

console.log(`\n[DONE] Grand total keys filled: ${grandTotal}`);
console.log(`\nNext steps:`);
console.log(`  npm run build`);
console.log(`  git add . && git commit -m "Auto-translate all 49 languages via Google Translate" && git push`);
