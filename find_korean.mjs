import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const koreanRegex = /[가-힣]/;

walkDir(path.join(process.cwd(), 'src'), function(filePath) {
  if (filePath.includes('i18n') || filePath.includes('locales')) return;
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    // Ignore line comments and basic block comments and logs
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.includes('console.log') || t.includes('console.error')) return;
    
    if (koreanRegex.test(t)) {
      // Check if it's already translated with t(
      // We will only print lines that DO NOT contain `t("` or `t('` or `t(\``
      if (!t.includes('t("') && !t.includes("t('") && !t.includes("t(`")) {
        console.log(`${path.basename(filePath)}:${i+1}: ${t}`);
      }
    }
  });
});
