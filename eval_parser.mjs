import fs from 'fs';
import * as acorn from 'acorn';

try {
  let content = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');
  const startIdx = content.indexOf('{');
  const endIdx = content.lastIndexOf('}');
  const jsonStr = content.substring(startIdx, endIdx + 1);

  acorn.parse("(" + jsonStr + ")", { ecmaVersion: 2020 });
  console.log("No syntax error found in acorn parse.");
} catch (e) {
  console.error("Syntax Error at line", e.loc?.line, "col", e.loc?.column, ":", e.message);
  
  if (e.loc) {
    let content = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    const jsonStr = content.substring(startIdx, endIdx + 1);
    
    const lines = jsonStr.split('\n');
    console.log("Context:");
    for (let i = Math.max(0, e.loc.line - 3); i < Math.min(lines.length, e.loc.line + 2); i++) {
       console.log(`${i+1}: ${lines[i]}`);
    }
  }
}
