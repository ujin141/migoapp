import fs from 'fs';

let content = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');
const startIdx = content.indexOf('{');
const endIdx = content.lastIndexOf('}');
const jsonStr = content.substring(startIdx, endIdx + 1);

console.log("jsonStr starts with:", jsonStr.substring(0, 50));
console.log("jsonStr ends with:", jsonStr.substring(jsonStr.length - 100));

try {
  const obj = (new Function(`return (${jsonStr})`))();
  console.log("Parsed OK. auto keys:", Object.keys(obj.auto || {}).length);
} catch (e) {
  console.error(e.message);
  // find the exact location of syntax error by using parsing module or just evaluate step by step
}
