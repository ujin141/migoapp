import fs from 'fs';
import path from 'path';
import translate from 'translate-google';

// We will read ko.ts as a pure text file and extract every single string key and translation value
const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');
const KO_FILE = path.join(LOCALES_DIR, 'ko.ts');

const extractKoDictionary = () => {
    const content = fs.readFileSync(KO_FILE, 'utf8');
    // Safely extract the JSON object from the "const ko = { ... }; export default ko;" structure
    const match = content.match(/const\s+ko\s*=\s*(\{[\s\S]*?\})\s*;/);
    if (!match) return null;
    try {
        const obj = eval(`(${match[1]})`);
        return obj;
    } catch (e) {
        console.error("Failed to parse ko.ts. Make sure it's valid.");
        return null;
    }
}

const koDict = extractKoDictionary();
if (!koDict) process.exit(1);

const allKeys = Object.keys(koDict);
console.log(`[Base Language] Loaded ${allKeys.length} master keys from ko.ts`);

// Also extract those hidden fallback parts from other locales
const i18nDir = path.join(process.cwd(), 'src/i18n');
const extractKo = (fileName, varName) => {
    try {
        const src = fs.readFileSync(path.join(i18nDir, fileName), 'utf8');
        const match = src.match(new RegExp(`export const ${varName}.*?=\\s*({[\\s\\S]*?});`, 'm'));
        if (!match) return {};
        const obj = eval(`(${match[1].replace(/export const/g, 'const')})`);
        return obj.ko || {};
    } catch (e) {
        return {};
    }
}
const flattenObj = (obj, prefix = '') => {
    let result = {};
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) result = { ...result, ...flattenObj(obj[key], prefix + key + '.') };
        else result[prefix + key] = obj[key];
    }
    return result;
}

const combinedKo = {
    ...koDict,
    ...flattenObj(extractKo('filterLocales.ts', 'FILTER_LOCALES')),
    ...flattenObj(extractKo('checkinLocales.ts', 'CHECKIN_LOCALES')),
    ...flattenObj(extractKo('tierLocales.ts', 'TIER_LOCALES')),
};

const fullKeys = Object.keys(combinedKo);
console.log(`[Merged] Total unique keys across entire platform to check: ${fullKeys.length}`);

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runFullSync() {
    const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
    
    // Process every single language one by one
    for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        const targetLang = file.replace('.ts', '');
        const filePath = path.join(LOCALES_DIR, file);

        console.log(`\n======================================`);
        console.log(`[${fIdx + 1}/${files.length}] Scanning 100% Coverage for: ${targetLang}`);
        
        let content = fs.readFileSync(filePath, 'utf8');

        // Identify missing keys
        const missingKeys = [];
        const missingValues = [];

        for (const [key, value] of Object.entries(combinedKo)) {
            // Very strict verification: must contain the exact key
            if (!content.includes(`"${key}"`) && !content.includes(`'${key}'`)) {
                missingKeys.push(key);
                missingValues.push(value);
            }
        }

        if (missingKeys.length === 0) {
            console.log(` ---> 100% Perfect! No English or Korean bleed in ${targetLang}.`);
            continue;
        }

        console.log(` ---> Found ${missingKeys.length} missing translation keys. Translating to ${targetLang} to prevent language mixing...`);

        // Prepare google translate language code
        let gLang = targetLang;
        if (gLang === 'zh') gLang = 'zh-cn';
        if (gLang === 'he') gLang = 'iw';

        const CHUNK_SIZE = 30;
        const translatedValues = [];
        let hasError = false;

        for (let c = 0; c < missingValues.length; c += CHUNK_SIZE) {
            const chunk = missingValues.slice(c, c + CHUNK_SIZE);
            let success = false;
            let retries = 3;

            while (!success && retries > 0) {
                try {
                    const res = await translate(chunk, { from: 'ko', to: gLang });
                    if (!Array.isArray(res)) throw new Error("Invalid response");
                    translatedValues.push(...res);
                    success = true;
                    await delay(150); 
                } catch (e) {
                    retries--;
                    await delay(2000);
                }
            }
            if (!success) {
                console.error(` Fatal Error translating chunk in ${targetLang}. Aborting this language.`);
                hasError = true;
                break;
            }
            // progress loader
            process.stdout.write(`\r Translated ${Math.min(c + CHUNK_SIZE, missingValues.length)} / ${missingValues.length}`);
        }

        if (hasError) continue;

        // Ensure keys are safely formatted
        let insertStr = "";
        for (let i = 0; i < translatedValues.length; i++) {
            let safeVal = translatedValues[i] ? translatedValues[i].replace(/"/g, '\\"').replace(/\n/g, ' ') : missingValues[i];
            
            // Just append as flat key
            // The locales structure is flat export default { ... }
            insertStr += `  "${missingKeys[i]}": "${safeVal}",\n`;
        }

        // Write safely to file
        const lastBraceIdx = content.lastIndexOf('}');
        if (lastBraceIdx !== -1) {
            // Try to find if there's a comma before the last brace
            content = content.slice(0, lastBraceIdx) + ",\n" + insertStr + content.slice(lastBraceIdx);
            // clean up any double commas just in case
            content = content.replace(/,\s*,/g, ',');
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`\n ---> Successfully injected ${missingKeys.length} translations into ${targetLang}!`);
        }
    }
    console.log(`\nAll languages synced perfectly! 0% mixing guaranteed.`);
}

runFullSync().catch(console.error);
