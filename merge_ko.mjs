import fs from 'fs';

let content = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');
const startIdx = content.indexOf('{');
const endIdx = content.lastIndexOf('}');
const jsonStr = content.substring(startIdx, endIdx + 1);

try {
  const obj = (new Function(`return (${jsonStr})`))();
  if (obj.auto && obj.auto2) {
    obj.auto = { ...obj.auto, ...obj.auto2 };
    delete obj.auto2;
    const finalContent = `const ko = ${JSON.stringify(obj, null, 2)};\nexport default ko;\n`;
    fs.writeFileSync('src/i18n/locales/ko.ts', finalContent, 'utf8');
    console.log("Merged ko.ts successfully.");
  } else {
    console.log("auto or auto2 not found.");
  }
} catch (e) {
  console.error("Parse failed", e);
}
