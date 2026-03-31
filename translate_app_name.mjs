import fs from 'fs';
import path from 'path';
import https from 'https';

const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
const textToTranslate = "Migo - 여행 동행 매칭앱";

// Helper to use free google translate API
function translate(text, targetLang) {
  return new Promise((resolve, reject) => {
    // some android locale codes need mapping for google translate:
    // zh-rCN -> zh-CN, zh-rTW -> zh-TW, pt-rBR -> pt-BR
    let glang = targetLang.replace('-r', '-');
    if (glang === 'in') glang = 'id'; // indonesian
    if (glang === 'iw') glang = 'he'; // hebrew
    if (glang === 'tl') glang = 'tl'; // tagalog
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=${glang}&dt=t&q=${encodeURIComponent(text)}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let translatedText = '';
          if (json && json[0]) {
            json[0].forEach(item => {
              if (item[0]) translatedText += item[0];
            });
          }
          resolve(translatedText || text);
        } catch (e) {
          resolve(text); // fallback to original
        }
      });
    }).on('error', () => {
      resolve(text);
    });
  });
}

async function run() {
  if (!fs.existsSync(resDir)) return console.log('resDir not found');
  
  const dirs = fs.readdirSync(resDir).filter(f => f.startsWith('values-'));
  console.log(`Found ${dirs.length} localized values directories.`);
  
  for (const dir of dirs) {
    let langCode = dir.replace('values-', '');
    // e.g. ko, en, zh-rCN
    
    // Skip Korean, as we already know it
    let translatedAppName = "Migo - 여행 동행 매칭앱";
    if (langCode !== 'ko') {
      try {
        translatedAppName = await translate(textToTranslate, langCode);
      } catch (e) {}
    }
    
    // sanitize XML for app_name (escape quotes, ampersands)
    translatedAppName = translatedAppName.replace(/&/g, '&amp;').replace(/'/g, "\\'").replace(/"/g, '\\"');
    
    const stringsPath = path.join(resDir, dir, 'strings.xml');
    if (fs.existsSync(stringsPath)) {
      const stringsXml = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <string name="app_name">${translatedAppName}</string>\n    <string name="title_activity_main">${translatedAppName}</string>\n    <string name="package_name">com.migo.app</string>\n    <string name="custom_url_scheme">com.migo.app</string>\n</resources>`;
      fs.writeFileSync(stringsPath, stringsXml, 'utf8');
      console.log(`Translated ${langCode}: ${translatedAppName}`);
    }
    
    // pause slightly to avoid rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('All app strings translated and saved!');
}

run();
