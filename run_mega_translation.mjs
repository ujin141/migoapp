import fs from 'fs';
import path from 'path';
import translate from 'translate-google';

const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');
const i18nDir = path.join(process.cwd(), 'src/i18n');

// 1. Extract strings from local config files
const filterSrc = fs.readFileSync(path.join(i18nDir, 'filterLocales.ts'), 'utf8');
const checkinSrc = fs.readFileSync(path.join(i18nDir, 'checkinLocales.ts'), 'utf8');
const tierSrc = fs.readFileSync(path.join(i18nDir, 'tierLocales.ts'), 'utf8');

// Use dangerous eval to grab the ko objects directly safely assuming local code
const extractKo = (str, varName) => {
    const match = str.match(new RegExp(`export const ${varName}.*?=\\s*({[\\s\\S]*?});`, 'm'));
    if (!match) return {};
    try {
        const noExports = match[1].replace(/export const/g, 'const');
        // A simple eval hack to parse the object string
        const obj = eval(`(${noExports})`);
        return obj.ko || {};
    } catch(e) {
        console.error(`Failed to extract ${varName}`, e);
        return {};
    }
}

const flattenObj = (obj, prefix = '') => {
    let result = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(result, flattenObj(obj[key], prefix + key + '.'));
        } else {
            result[prefix + key] = obj[key];
        }
    }
    return result;
}

const filterKo = extractKo(filterSrc, 'FILTER_LOCALES');
const checkinKo = extractKo(checkinSrc, 'CHECKIN_LOCALES');
const tierKo = extractKo(tierSrc, 'TIER_LOCALES');

const combinedKo = flattenObj({ ...filterKo, ...checkinKo, ...tierKo });
const allKeys = Object.keys(combinedKo);

console.log(`Extracted ${allKeys.length} localized strings from internal files.`);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
  console.log(`Starting massive translation for ${files.length} languages...`);

  const CHUNK_SIZE = 30;
  
  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const targetLang = file.replace('.ts', '');
    const filePath = path.join(LOCALES_DIR, file);

    console.log(`\n[${fIdx + 1}/${files.length}] Processing ${targetLang}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    const missingKeys = [];
    const missingValues = [];

    // Simple robust check for missing nested keys
    for (const [flatKey, value] of Object.entries(combinedKo)) {
        // e.g. flatKey = gf.c_tokyo
        // Check if content has "c_tokyo"
        const lastKey = flatKey.split('.').pop();
        if (!content.includes(`"${lastKey}"`) && !content.includes(`'${lastKey}'`)) {
            missingKeys.push(flatKey);
            missingValues.push(value);
        }
    }

    if (missingKeys.length === 0) {
        console.log(` ---> Perfect! ${targetLang} already has all keys.`);
        continue;
    }

    console.log(` ---> Translating ${missingKeys.length} missing strings for ${targetLang}...`);

    let gLang = targetLang;
    if (gLang === 'zh') gLang = 'zh-cn';
    if (gLang === 'he') gLang = 'iw'; 

    const translatedValues = [];
    let hasError = false;

    for (let c = 0; c < missingValues.length; c += CHUNK_SIZE) {
      const chunk = missingValues.slice(c, c + CHUNK_SIZE);
      let success = false;
      let retries = 4;

      while (!success && retries > 0) {
        try {
          const res = await translate(chunk, { from: 'ko', to: gLang });
          
          if (!Array.isArray(res) || res.length !== chunk.length) {
            throw new Error(`Length mismatch`);
          }
          
          translatedValues.push(...res);
          success = true;
          await delay(200); 
        } catch (e) {
          retries--;
          console.warn(`      - Error: ${e.message}. Retries left: ${retries}`);
          await delay(2500); 
        }
      }

      if (!success) {
        hasError = true;
        break;
      }
    }

    if (hasError) continue;

    // Convert flat keys back to nested JSON string insertion
    // Note: Since index.ts merges ...FILTER with res.default, putting them as flat or nested in locales works identically if structured properly
    // Let's create an object representation and then inject it
    let injectionObj = {};
    for (let i = 0; i < translatedValues.length; i++) {
        let safeVal = translatedValues[i].replace(/"/g, '\\"').replace(/\n/g, ' ');
        const pathParts = missingKeys[i].split('.');
        let curr = injectionObj;
        for (let p = 0; p < pathParts.length - 1; p++) {
            if (!curr[pathParts[p]]) curr[pathParts[p]] = {};
            curr = curr[pathParts[p]];
        }
        curr[pathParts[pathParts.length - 1]] = safeVal;
    }

    // Now convert the object to a string format to append
    let insertStr = "";
    const buildInsertStr = (obj, prefix = "    ") => {
        let str = "";
        for (const [k, v] of Object.entries(obj)) {
            if (typeof v === 'object') {
                str += `${prefix}"${k}": {\n` + buildInsertStr(v, prefix + "  ") + `${prefix}},\n`;
            } else {
                str += `${prefix}"${k}": "${v}",\n`;
            }
        }
        return str;
    };
    insertStr = buildInsertStr(injectionObj);

    if (insertStr.length > 0) {
      const lastIdx = content.lastIndexOf('};');
      if (lastIdx !== -1) {
        content = content.slice(0, lastIdx).replace(/\}\s*$/, '},\n') + insertStr + content.slice(lastIdx);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   --> Updated ${file} successfully!`);
      }
    }
  }
  
  console.log("\nMassive translation completed safely!");
}

run().catch(console.error);
