import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));

let totalFixed = 0;

for (const file of files) {
  const fp = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(fp, 'utf8');
  let originalContent = content;

  // Fix: `,\n    "` -> `,\n    "`
  content = content.replace(/,\\n\s+"/g, ',\n    "');
  
  // Fix: `"\n  }` -> `"\n  }`
  content = content.replace(/"\\n\s+\}/g, '"\n  }');

  // Fix: `{\n  ,\n    "` -> `{\n    "`
  content = content.replace(/\{\\n\s*,\\n\s+"/g, '{\n    "');

  // Fix: `}\n,\n  "` -> `},\n  "`
  content = content.replace(/\}\\n,\\n\s+"/g, '},\n  "');

  // Fix: `}\n};` -> `}\n};`
  content = content.replace(/\}\\n;/g, '};');

  // Fix: `\nexport default` -> `\nexport default`
  content = content.replace(/\\nexport default/g, '\nexport default');
  
  // Custom fix for en.ts top level injection: `,\n  "section": {\n`
  content = content.replace(/,\\n\s+"([a-zA-Z0-9_\-]+)":\s*\{\\n\s+/g, ',\n  "$1": {\n  ');

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
    totalFixed++;
    console.log(`[v] Fixed newlines via regex in ${file}`);
  }
}

console.log(`\nCleanup complete. Fixed ${totalFixed} files.`);
