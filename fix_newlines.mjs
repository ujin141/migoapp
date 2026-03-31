import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));

let totalFixed = 0;

for (const file of files) {
  const fp = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(fp, 'utf8');
  let originalContent = content;

  // Extremely targeted replacements to avoid affecting valid '\n' within translation text.
  content = content.split(',\\n  "').join(',\n  "');
  content = content.split('{\\n  ,\\n    "').join('{\n    "');
  content = content.split('"\\n  ,\\n    "').join('",\n    "');
  content = content.split('"\\n  }\\n,\\n  "').join('"\n  },\n  "');
  content = content.split('"\\n  }\\n};').join('"\n  }\n};');
  content = content.split('}\\n};').join('}\n};');

  if (content !== originalContent) {
    fs.writeFileSync(fp, content, 'utf8');
    totalFixed++;
    console.log(`[v] Fixed newlines in ${file}`);
  }
}

console.log(`\nCleanup complete. Fixed ${totalFixed} files.`);
