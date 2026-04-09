import fs from 'fs';
const content = fs.readFileSync('src/pages/ProfilePage.tsx', 'utf8');
const lines = content.split('\n');
console.log("--- 510-515 ---");
console.log(JSON.stringify(lines.slice(509, 515)));
console.log("--- 550-556 ---");
console.log(JSON.stringify(lines.slice(549, 556)));
console.log("--- 694-702 ---");
console.log(JSON.stringify(lines.slice(693, 702)));
