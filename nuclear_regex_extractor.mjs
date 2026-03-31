import fs from 'fs';

const targets = [
  'src/pages/MatchPage.tsx',
  'src/pages/MeetReviewPage.tsx',
  'src/pages/NotificationPage.tsx',
  'src/pages/ProfilePage.tsx',
  'src/pages/ProfileSetupPage.tsx',
  'src/pages/VerificationPage.tsx',
  'src/pages/TermsPage.tsx',
  'src/pages/PrivacyPage.tsx',
];

const newKeys = {};
let keyId = 500;

for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace isolated JSX Text bounding nodes
  code = code.replace(/>(\s*)([^<>{}\n]*[가-힣]+[^<>{}\n]*)(\s*)</g, (match, prefix, text, suffix) => {
    const cleanStr = text.trim();
    if (!cleanStr || cleanStr.startsWith('//') || cleanStr.includes('t("')) return match;
    const key = `auto.j${keyId++}`;
    newKeys[key] = cleanStr;
    changed = true;
    return `>${prefix}{t("${key}")}${suffix}<`;
  });

  // 2. Replace String Literals in object properties like title="Korean" or content: "Korean"
  code = code.replace(/([a-zA-Z0-9_]+)\s*(?:=|:)\s*(["'])([^"'\n]*[가-힣]+[^"'\n]*)\2/g, (match, prop, quote, text) => {
    if (prop === 'className' || prop === 'type' || prop === 'variant' || prop === 'dir' || prop === 'id') return match;
    if (text.includes('t("') || text.includes('getArr(')) return match;
    
    // Let's not mess with React event refs or template literals implicitly matched
    
    const key = `auto.p${keyId++}`;
    newKeys[key] = text;
    changed = true;
    
    if (match.includes('=')) {
       return `${prop}={t("${key}")}`;
    } else {
       return `${prop}: t("${key}")`;
    }
  });

  if (changed) {
     if (!code.includes('useTranslation')) {
        code = `import { useTranslation } from "react-i18next";\n` + code;
     }
     fs.writeFileSync(file, code, 'utf8');
     console.log(`Regex Patched: ${file}`);
  }
}

// Inject ko.ts
const koTsPath = 'src/i18n/locales/ko.ts';
if (fs.existsSync(koTsPath) && Object.keys(newKeys).length > 0) {
  let koTsContent = fs.readFileSync(koTsPath, 'utf8');
  const entries = Object.entries(newKeys).map(([k, v]) => `    "${k}": "${v.replace(/"/g, "'").replace(/\n/g, '\\n')}",`).join('\n');
  const injection = `  auto: {\n${entries}\n  }\n};\nexport default ko;`;
  
  if (!koTsContent.includes('auto: {')) {
    koTsContent = koTsContent.replace(/};\s*export\s+default\s+ko;/g, injection);
    fs.writeFileSync(koTsPath, koTsContent, 'utf8');
    console.log(`Generated ${Object.keys(newKeys).length} auto keys!`);
  }
}
