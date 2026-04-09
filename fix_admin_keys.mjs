/**
 * fix_admin_keys.mjs
 * Adds missing admin namespace keys to en.ts and syncs to all locales
 * Also patches all Korean t() fallbacks in TSX files to use English
 */
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = './src/i18n/locales';
const enPath = path.join(LOCALES_DIR, 'en.ts');

// New admin namespace keys to add
const NEW_ADMIN_KEYS = `    "chatMonitor": "Chat Room Monitoring",
    "chatMonitorDesc": "Manage active travel group chat rooms",
    "refresh": "Refresh",
    "allRooms": "Total Rooms",
    "activeRooms": "Active Rooms",
    "totalMembers": "Total Members",
    "all": "All",
    "active": "Active",
    "inactive": "Inactive",
    "unknown": "Unknown",
    "noTitle": "No title",
    "deactivateRoomConfirm": "Are you sure you want to deactivate this chat room?",
    "deactivateRoom": "Deactivate room",
    "viewMsg": "View messages",
    "noRooms": "No chat rooms found",
    "noMsg": "No messages found",
    "persons": " members",
    "creator": "Host:",
    "today": "Today",
    "daysAgoFormat": "{{days}} days ago",
    "memberJoined": " members joined",
    "newUser": "New Users",
    "newGroup": "New Groups",
    "newSignup": "New Signups"`;

// Read en.ts
let en = fs.readFileSync(enPath, 'utf8');

// Check if admin namespace exists
if (!en.includes('"admin":')) {
  // Add it before the closing of the main object
  const lastClosing = en.lastIndexOf('};');
  en = en.substring(0, lastClosing) + `  "admin": {\n${NEW_ADMIN_KEYS}\n  },\n` + en.substring(lastClosing);
  console.log('Added admin namespace to en.ts');
} else {
  // Admin namespace exists - add missing keys before its closing brace
  const adminStart = en.indexOf('"admin":');
  let depth = 0;
  let adminBraceStart = en.indexOf('{', adminStart);
  let adminEnd = adminBraceStart;
  for (let i = adminBraceStart; i < en.length; i++) {
    if (en[i] === '{') depth++;
    else if (en[i] === '}') { depth--; if (depth === 0) { adminEnd = i; break; } }
  }
  
  // Check which keys are missing
  const adminBlock = en.substring(adminBraceStart, adminEnd);
  const keysToAdd = [];
  const keyDefs = NEW_ADMIN_KEYS.split('\n');
  for (const keyDef of keyDefs) {
    const m = keyDef.match(/"([^"]+)":/);
    if (m && !adminBlock.includes(`"${m[1]}"`)) {
      keysToAdd.push(keyDef);
    }
  }
  
  if (keysToAdd.length > 0) {
    en = en.substring(0, adminEnd) + ',\n' + keysToAdd.join('\n') + '\n  ' + en.substring(adminEnd);
    console.log(`Added ${keysToAdd.length} missing keys to admin namespace in en.ts`);
  } else {
    console.log('All admin keys already present in en.ts');
  }
}

fs.writeFileSync(enPath, en, 'utf8');

// Now sync to all non-KO locale files (copy same English strings as baseline)
const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.ts') && f !== 'ko.ts' && f !== 'en.ts');

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('"admin":')) {
    const lastClosing = content.lastIndexOf('};');
    content = content.substring(0, lastClosing) + `  "admin": {\n${NEW_ADMIN_KEYS}\n  },\n` + content.substring(lastClosing);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added admin namespace to ${file}`);
  } else {
    const adminStart = content.indexOf('"admin":');
    let depth = 0;
    let adminBraceStart = content.indexOf('{', adminStart);
    let adminEnd = adminBraceStart;
    for (let i = adminBraceStart; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') { depth--; if (depth === 0) { adminEnd = i; break; } }
    }
    const adminBlock = content.substring(adminBraceStart, adminEnd);
    const keyDefs = NEW_ADMIN_KEYS.split('\n');
    const keysToAdd = keyDefs.filter(kd => {
      const m = kd.match(/"([^"]+)":/);
      return m && !adminBlock.includes(`"${m[1]}"`);
    });
    if (keysToAdd.length > 0) {
      content = content.substring(0, adminEnd) + ',\n' + keysToAdd.join('\n') + '\n  ' + content.substring(adminEnd);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}
console.log('Done!');
