/**
 * fix_admin_insertion.mjs
 * Fixes locale files where admin namespace was inserted OUTSIDE the main object
 * (after the closing }; instead of inside it)
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts'));
let fixed = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if admin block is after the main object close (pattern: };\n  "admin": {)
  // This means it was inserted outside the main export
  // The file should end with: ...last_key\n  }\n};\nexport default xxx;
  // But instead we have: ...last_key\n  }\n  "admin": {\n  ...\n  },\n};\nexport default xxx;
  
  // Find if admin block is placed correctly (inside the main object) or outside
  const mainObjEndIdx = content.lastIndexOf('\n};');
  const adminIdx = content.indexOf('"admin":');
  
  if (adminIdx === -1) continue; // no admin block
  
  // Check if there's a }; between the last auto/z_ key and the admin block
  // Pattern to detect wrong insertion: content has "  }\n  \"admin\":" (closing the namespace prematurely)
  // Looking for pattern: key-value-pair\n  }\n  "admin":
  
  // The bug: script found lastIndexOf('};') and inserted before it
  // but the actual last key might have had a } from a nested structure
  
  // Better approach: check the parsed structure
  // Wrong: the admin block may be outside the main translation object
  // Look for "}\n  \"admin\":" pattern without a comma
  
  if (content.match(/\}\s*\n\s*"admin":/)) {
    // Check if there's no comma before admin
    const wrongPattern = content.match(/\n\s*\}\s*\n(\s*"admin":)/);
    if (wrongPattern) {
      // Need to fix: move admin inside the main object
      // 1. Remove the misplaced admin block  
      // 2. Find the correct closing of the auto namespace
      // 3. Insert admin correctly before the main }
      
      const adminStart = content.indexOf('"admin":');
      const lineStart = content.lastIndexOf('\n', adminStart) + 1;
      
      // Find the end of admin block
      let depth = 0;
      let adminBrace = content.indexOf('{', adminStart);
      let adminEnd = adminBrace;
      for (let i = adminBrace; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') { depth--; if (depth === 0) { adminEnd = i; break; } }
      }
      
      // Extract admin block content (just the key-value pairs)
      const adminBlock = content.substring(lineStart, adminEnd + 2); // includes trailing },\n or }
      
      // Remove the misplaced admin block
      let newContent = content.substring(0, lineStart) + content.substring(adminEnd + 2);
      
      // Find the correct position: just before the last }; of the main object
      // The main object ends with: last-pair\n  }\n};\nexport default
      // We need to insert BEFORE the }\n};
      const exportIdx = newContent.lastIndexOf('export default');
      const mainCloseIdx = newContent.lastIndexOf('};', exportIdx);
      
      // Go back from }; to find the previous } that closes the main namespace
      // Insert admin with a leading comma on the previous line
      const insertionPoint = newContent.lastIndexOf('\n}', mainCloseIdx);
      
      // Fix trailing comma issue on the last key in the namespace
      const beforeInsertion = newContent.substring(0, insertionPoint);
      const afterInsertion = newContent.substring(insertionPoint);
      
      // Add comma after last entry if needed
      const trimmedBefore = beforeInsertion.trimEnd();
      const needsComma = !trimmedBefore.endsWith(',');
      
      const adminInsert = `${needsComma ? ',' : ''}\n  ${adminBlock.trim()}\n`;
      newContent = trimmedBefore + adminInsert + afterInsertion;
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed ${file}`);
      fixed++;
    }
  }
}

console.log(`\nFixed ${fixed} files`);
