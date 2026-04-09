const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

const LOCALES_DIR = '/Users/song-ujin/.gemini/antigravity/scratch/migoapp/src/i18n/locales';
const SOURCE_JSON = '/tmp/ko_strings_v2.json'; // The newly generated massive payload of 2395 strings

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const dict = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
  const allKeys = Object.keys(dict);

  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
  console.log(`Found ${files.length} language locales to translate.`);

  const CHUNK_SIZE = 30; // 30 per chunk to preserve Google limits
  
  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const targetLang = file.replace('.ts', '');
    const filePath = path.join(LOCALES_DIR, file);

    console.log(`\n[${fIdx + 1}/${files.length}] Deep Scanning & Processing ${targetLang}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Only process keys that are NOT currently in the file
    const missingKeys = [];
    const missingValues = [];

    for (let i = 0; i < allKeys.length; i++) {
        const k = allKeys[i];
        if (!content.includes(`"${k}"`) && !content.includes(`'${k}'`)) {
            missingKeys.push(k);
            missingValues.push(dict[k]);
        }
    }

    if (missingKeys.length === 0) {
        console.log(` ---> Perfect! ${targetLang} is fully translated.`);
        continue;
    }

    console.log(` ---> Missing ${missingKeys.length} strings in ${targetLang}. Initiating chunked translation...`);

    // Map special country codes that differ from standard ISO
    let gLang = targetLang;
    if (gLang === 'zh') gLang = 'zh-cn';
    if (gLang === 'he') gLang = 'iw'; // translate-google uses iw, not he

    const translatedValues = [];
    let hasError = false;

    // chunking process
    for (let c = 0; c < missingValues.length; c += CHUNK_SIZE) {
      const chunk = missingValues.slice(c, c + CHUNK_SIZE);
      let success = false;
      let retries = 4;

      while (!success && retries > 0) {
        try {
          const res = await translate(chunk, { from: 'ko', to: gLang });
          
          if (!Array.isArray(res) || res.length !== chunk.length) {
            throw new Error(`Length mismatch: got ${res ? res.length : 0} expected ${chunk.length}`);
          }
          
          translatedValues.push(...res);
          success = true;
          await delay(200); 
        } catch (e) {
          retries--;
          console.warn(`      - Error on chunk ${c/CHUNK_SIZE}, retries left: ${retries}. Msg: ${e.message}`);
          await delay(2500); // 2.5sec slowdown on error
        }
      }

      if (!success) {
        console.error(`      -> Fatal failure translating ${targetLang} at chunk ${c/CHUNK_SIZE}. Aborting remainder for this locale.`);
        hasError = true;
        break;
      }
    }

    // Attempt to inject whatever safely translated so far
    let insertStr = "";
    for (let i = 0; i < translatedValues.length; i++) {
       const key = missingKeys[i];
       // basic sanitization of single / double quotes
       let safeVal = translatedValues[i] 
         ? translatedValues[i].replace(/"/g, '\\"').replace(/\n/g, ' ') 
         : missingValues[i];
       insertStr += `    "${key}": "${safeVal}",\n`;
    }

    if (insertStr.length > 0) {
      const lastIdx = content.lastIndexOf('};');
      if (lastIdx !== -1) {
        content = content.slice(0, lastIdx).replace(/\}\s*$/, '},\n') + insertStr + content.slice(lastIdx);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   --> Updated ${file} with ${translatedValues.length} strings!`);
      } else {
        console.error(`   --> Could not find "};" to inject into ${file}. Ignoring injection.`);
      }
    }
  }
  
  console.log("\nDeep V2 Translator process successfully finalized.");
}

run().catch(console.error);
