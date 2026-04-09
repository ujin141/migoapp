import fs from 'fs';

let content = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');

// 1. Remove the bad auto2 block that was injected previously
// The bad injection looked like: }, \n "auto2": { ... } \n }; \n export default ko;
// We'll strip from the first occurrence of "auto2": { to the end, and restore the proper end.
const auto2Idx = content.indexOf('"auto2": {');
if (auto2Idx !== -1) {
  // Find the previous }, that we need to fix
  const beforeAuto2 = content.substring(0, auto2Idx);
  const lastBracketComma = beforeAuto2.lastIndexOf('},');
  if (lastBracketComma !== -1) {
    // We just want to restore it to be valid. The last line before '},' was actually `  "auto.p35": "오늘 {{val}}번 남았어요",` or similar.
    // Wait, let's just use string replacement
    content = beforeAuto2.substring(0, lastBracketComma) + '\n};\nexport default ko;\n';
  }
}

// 2. Parse the fixed content
const startIdx = content.indexOf('{');
const endIdx = content.lastIndexOf('}');
const jsonStr = content.substring(startIdx, endIdx + 1);

let koObj;
try {
  koObj = (new Function(`return (${jsonStr})`))();
} catch (e) {
  console.error("Still fails to parse after cleanup:", e.message);
  process.exit(1);
}

// 3. Inject extracted_babel.json into koObj
const extracted = JSON.parse(fs.readFileSync('extracted_babel.json', 'utf8'));
for (const [k, v] of Object.entries(extracted)) {
  koObj[k] = v; // put at root level!
}

// 4. Write back
const finalContent = `const ko = ${JSON.stringify(koObj, null, 2)};\nexport default ko;\n`;
fs.writeFileSync('src/i18n/locales/ko.ts', finalContent, 'utf8');
console.log("Successfully safely injected extracted strings into ko.ts root!");
