import fs from 'fs';
import path from 'path';

const dir = 'src/i18n/locales';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
  const fp = path.join(dir, f);
  const lines = fs.readFileSync(fp, 'utf8').split('\n');
  
  // Track keys to find literal duplicate properties on a per-file basis
  // We'll just do a very simple string replacement
  // We know the exact duplicate texts based on the compiler output:
  // google: "Continue with Google", apple: "Apple",
  // Apple only appears in the `apple: "Apple"` duplicate which was appended, while the original was probably translated or identical.
  // Actually, wait! The error output for ALL files was exact:
  //   passReset: "Password reset email sent 📧", google: "Continue with Google", apple: "Apple",
  //   needAll: "Please fill in all fields", passMin: "Password must be at least 6 characters",
  
  let newContent = lines.join('\n');
  
  // Remove the second instance using a regex trick or manual string split
  const appleParts = newContent.split('apple: "Apple",');
  if (appleParts.length > 2) {
      newContent = appleParts[0] + 'apple: "Apple",' + appleParts.slice(1).join('').replace(/apple: "Apple",/g, '');
  }
  
  const needAllParts = newContent.split('needAll: "Please fill in all fields",');
  if (needAllParts.length > 2) {
      newContent = needAllParts[0] + 'needAll: "Please fill in all fields",' + needAllParts.slice(1).join('').replace(/needAll: "Please fill in all fields",/g, '');
  }
  
  fs.writeFileSync(fp, newContent, 'utf8');
});

console.log("Locales Cleaned");
