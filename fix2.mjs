import fs from 'fs';

let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

// The exact issue is missing closing divs for md:hidden and the header block.
// Find the logout button block in the header.
const fixed = content.replace(
  /<Lock size=\{12\} \/> Logout\s*<\/button>\s*<\/div>\s*<nav/g,
  '<Lock size={12} /> Logout\n            </button>\n          </div>\n        </div>\n        <nav'
);

fs.writeFileSync('src/pages/AdminPage.tsx', fixed, 'utf8');
console.log("Replaced using Regex.");
