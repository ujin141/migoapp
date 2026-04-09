const fs = require('fs');
const path = require('path');
const translate = require('translate-google');

const LOCALES_DIR = '/Users/song-ujin/.gemini/antigravity/scratch/migoapp/src/i18n/locales';
const SOURCE_JSON = '/tmp/ko_strings.json';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  const dict = JSON.parse(fs.readFileSync(SOURCE_JSON, 'utf8'));
  const keys = Object.keys(dict);
  const values = Object.values(dict);

  const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts');
  console.log(`Found ${files.length} languages to translate.`);

  const CHUNK_SIZE = 30;
  
  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const targetLang = file.replace('.ts', '');
    const filePath = path.join(LOCALES_DIR, file);

    console.log(`\n[${fIdx + 1}/${files.length}] Processing ${targetLang}...`);
    let content = fs.readFileSync(filePath, 'utf8');

    const lastKey = keys[keys.length - 1];
    if (content.includes(`"${lastKey}"`) || content.includes(`'${lastKey}'`)) {
      console.log(`Skipping ${targetLang} (Looks already translated)`);
      continue;
    }

    const translatedValues = [];
    let hasError = false;

    // IMPORTANT: Some language codes in JS / standard might need mapping for Google Translate.
    // translate-google generally accepts standard 2-letter codes.
    let gLang = targetLang;
    if (gLang === 'zh') gLang = 'zh-cn';

    for (let c = 0; c < values.length; c += CHUNK_SIZE) {
      const chunk = values.slice(c, c + CHUNK_SIZE);
      let success = false;
      let retries = 3;

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
          console.warn(`    - Error on chunk ${c/CHUNK_SIZE}, retries left: ${retries}. Msg: ${e.message}`);
          await delay(2000);
        }
      }

      if (!success) {
        console.error(`Failed to reliably translate ${targetLang}. Aborting this language.`);
        hasError = true;
        break;
      }
    }

    if (hasError) continue;

    let insertStr = "";
    for (let i = 0; i < keys.length; i++) {
       const key = keys[i];
       if (!content.includes(`"${key}"`) && !content.includes(`'${key}'`)) {
         let safeVal = translatedValues[i] ? translatedValues[i].replace(/"/g, '\\"').replace(/\n/g, ' ') : values[i];
         insertStr += `    "${key}": "${safeVal}",\n`;
       }
    }

    if (insertStr.length > 0) {
      // Find the closing bracket of the default export
      // Usually it ends with "}; \n export default" or just "};"
      const lastIdx = content.lastIndexOf('};');
      if (lastIdx !== -1) {
        content = content.slice(0, lastIdx) + insertStr + content.slice(lastIdx);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`   --> Updated ${file} with ${translatedValues.length} new keys!`);
      } else {
        console.error(`   --> Could not find "};" to inject into ${file}.`);
      }
    }
  }
  console.log("\nAll translations completed successfully.");
}

run().catch(console.error);
