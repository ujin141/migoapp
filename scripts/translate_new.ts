import * as fs from 'fs';
import * as path from 'path';
import translate from 'translate-google';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithRetry(obj: Record<string, string>, lang: string, retries = 3): Promise<Record<string, string> | null> {
  const gLang = lang === 'zh' ? 'zh-cn' : lang === 'he' ? 'iw' : lang; // Convert zh to zh-cn, he to iw
  for (let i = 0; i < retries; i++) {
    try {
      if (lang === 'en') {
         // Auto-translate to English is built-in logic sometimes, but let's translate explicitly to English so keys aren't literal Korean
      }
      return await translate(obj, { to: gLang });
    } catch (e: any) {
      console.log(`[Translate Error] attempt ${i+1}/${retries} for ${lang}: ${e.message}`);
      await delay(2000);
    }
  }
  return null;
}

async function main() {
  const newMapPath = path.join(process.cwd(), 'extracted_new.json');
  const tplMapPath = path.join(process.cwd(), 'extracted_templates.json');
  
  const translationsToMerge: Record<string, string> = {};
  
  if (fs.existsSync(newMapPath)) {
    Object.assign(translationsToMerge, JSON.parse(fs.readFileSync(newMapPath, 'utf8')));
  }
  if (fs.existsSync(tplMapPath)) {
    Object.assign(translationsToMerge, JSON.parse(fs.readFileSync(tplMapPath, 'utf8')));
  }
  
  const keys = Object.keys(translationsToMerge);
  if (keys.length === 0) {
    console.log("No translations to merge.");
    return;
  }
  
  // Filter out the keys we just undid (like auto.x4000 ~ auto.x4024) to keep things clean.
  // Actually, we don't need to filter them out; they won't be used by the UI anymore but injecting them hurts nothing.
  
  console.log(`Found ${keys.length} new strings to translate.`);
  
  const localesDir = path.join(process.cwd(), 'src/i18n/locales');
  const locales = fs.readdirSync(localesDir).filter(f => f.endsWith('.ts'));

  console.log(`Translating to ${locales.length} languages...`);

  for (const localeFileName of locales) {
    const lang = localeFileName.replace('.ts', '');
    const localePath = path.join(localesDir, localeFileName);
    
    console.log(`\n============================`);
    console.log(`Processing [${lang}]...`);
    
    
    // We want to insert our key/value pairs at the bottom, just before the outermost closing brace }
    
    let fileContent = fs.readFileSync(localePath, 'utf8');
    
    // (Removed auto.x4000 skip logic so we can push these Map toasts to all files)

    
    // Korean locale should NOT be translated, just inject the values directly
    let translatedObj: Record<string, string>;
    if (lang === 'ko') {
      translatedObj = translationsToMerge;
    } else {
      console.log(`Translating ${keys.length} entries to ${lang}...`);
      const trRes = await translateWithRetry(translationsToMerge, lang);
      if (!trRes) {
        console.log(`Failed to translate ${lang}. Skipping...`);
        continue;
      }
      translatedObj = trRes;
    }
    
    // Read the current locale.ts
    // The format is export default { ... } or const localeObj = { ... }; export default localeObj;
    // removed let fileContent
    
    // We want to insert our key/value pairs at the bottom, just before the outermost closing brace }
    const lastBraceIndex = fileContent.lastIndexOf('}');
    if (lastBraceIndex === -1) {
      console.log(`Could not find closing brace for ${lang}, skipping.`);
      continue;
    }
    
    let injectedString = '';
    for (const key of keys) {
      // safely escape quotes
      const val = translatedObj[key].replace(/"/g, '\\"');
      injectedString += `\n    "${key}": "${val}",`;
    }
    
    // Insert trailing comma on previous line if missing (optional but safe to just prepend comma to our block? No, better to just inject safely)
    // A simple hack: just inject it before the last }
    // If the file ended with something without comma, TS will complain. 
    // We can assume standard formatting where we can just inject `,\n` before our lines if we aren't sure.
    // It's safer to ensure a comma exists.
    
    const beforeBrace = fileContent.substring(0, lastBraceIndex).trimEnd();
    const hasComma = beforeBrace.endsWith(',') || beforeBrace.endsWith('{');
    const commaNeeded = !hasComma ? ',' : '';
    
    const newFileContent = beforeBrace + commaNeeded + injectedString + '\n' + fileContent.substring(lastBraceIndex);
    
    fs.writeFileSync(localePath, newFileContent, 'utf8');
    console.log(`✅ Injected ${keys.length} translated keys into ${lang}.ts`);
    
    await delay(1000); // 1 second delay to avoid rate limiting
  }
  
  console.log('All translations complete!');
}

main().catch(console.error);
