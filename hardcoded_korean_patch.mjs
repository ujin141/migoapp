import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const localesDir = path.join(process.cwd(), 'src', 'i18n', 'locales');
const extracted = {};

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    if (filePath.includes(path.join('src', 'i18n', 'locales'))) return;
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;

  // 1. Match JSX text: >한글<
  content = content.replace(/>([^<>{}]+[가-힣]+[^<>{}]+)</g, (match, p1) => {
    let text = p1.trim();
    if (!text || text.includes('console.')) return match;
    extracted[text] = text;
    // Replace the exact text with {t("...")} while preserving spaces around it
    // if there was space, keep it
    const before = p1.match(/^\s*/)[0];
    const after = p1.match(/\s*$/)[0];
    return `>${before}{t("${text.replace(/"/g, '\\"')}")}${after}<`;
  });

  // 2. Match simple string literals: "한글" or '한글'
  content = content.replace(/(["'])([^"'`\n]*[가-힣]+[^"'`\n]*)\1/g, (match, q, p1) => {
    // Avoid requires, imports, classnames with spaces that accidentally match? (unlikely to have korean classnames)
    let text = p1;
    if (!text || text.includes('import ') || text.includes('from ')) return match;
    extracted[text] = text;
    return `t("${text.replace(/"/g, '\\"')}")`;
  });

  if (orig !== content) {
    const isComponent = file.endsWith('.tsx');
    if (isComponent) {
      if (!content.includes('useTranslation')) {
        content = `import { useTranslation } from 'react-i18next';\n` + content;
      }
      if (!content.includes('const { t } = useTranslation()')) {
        // try to find where to put it
        let injected = false;
        content = content.replace(/(const [A-Z]\w+\s*=\s*\([^)]*\)(?:\s*:\s*\w+)?\s*=>\s*\{)(?!\s*const \{ t \})/, (m) => {
          injected = true;
          return m + '\n  const { t } = useTranslation();';
        });
        if (!injected) {
          content = content.replace(/(export function [A-Z]\w+\([^)]*\)\s*\{)/, (m) => {
            injected = true;
            return m + '\n  const { t } = useTranslation();';
          });
        }
        if (!injected) {
          content = content.replace(/(function [A-Z]\w+\([^)]*\)\s*\{)/, (m) => {
            injected = true;
            return m + '\n  const { t } = useTranslation();';
          });
        }
      }
    } else {
      // For pure .ts files
      if (!content.includes('import i18n from')) {
        content = `import i18n from '@/i18n';\n` + content;
      }
      // Replace raw t(" with i18n.t("
      content = content.replace(/([^a-zA-Z0-9_.])t\("/g, '$1i18n.t("');
      // For lines that start with t("... (like first line inside an object or array)
      content = content.replace(/^t\("/gm, 'i18n.t("');
    }
    
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});

console.log('Patched ' + changedCount + ' files with hardcoded strings.');

// Append to ko.ts
if (Object.keys(extracted).length > 0) {
  const koPath = path.join(localesDir, 'ko.ts');
  if (fs.existsSync(koPath)) {
    let koContent = fs.readFileSync(koPath, 'utf8');
    // VERY simple evaluator
    try {
      const jsonStr = koContent
        .replace(/export default \w+;?/, '')
        .replace(/const \w+ = /, '')
        .replace(/;?\s*$/, '')
        .trim();
      let koObj = (new Function(`return ${jsonStr}`))();
      
      // Inject extracted
      koObj = { ...koObj, ...extracted };
      
      const newKoStr = `const ko = ${JSON.stringify(koObj, null, 2)};\nexport default ko;\n`;
      fs.writeFileSync(koPath, newKoStr, 'utf8');
      console.log('Added ' + Object.keys(extracted).length + ' new keys to ko.ts!');
    } catch (e) {
      console.error('Failed to update ko.ts', e.message);
    }
  }
}
