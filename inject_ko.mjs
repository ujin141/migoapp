import fs from 'fs';

const recovered = JSON.parse(fs.readFileSync('recovered.json', 'utf8'));

// Filter out undefined/null/empty values just in case
const cleaned = {};
for (const [k, v] of Object.entries(recovered)) {
  if (k && v && typeof v === 'string') {
    // Avoid escaping errors by just removing quotes if any, since we wrap them in quotes
    let cleanVal = v.replace(/"/g, "'");
    cleaned[k] = cleanVal;
  }
}

let koTs = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');

// Ensure we don't inject multiple times
if (!koTs.includes('alert: {')) {
  const entries = Object.entries(cleaned).map(([k, v]) => `    "${k}": "${v}",`).join('\n');
  const injection = `  alert: {\n${entries}\n  }\n};\nexport default ko;`;
  
  const newKoTs = koTs.replace(/};\s*export\s+default\s+ko;/g, injection);
  
  if (newKoTs === koTs) {
     console.error("Replacement failed! ko.ts did not match regex.");
  } else {
     fs.writeFileSync('src/i18n/locales/ko.ts', newKoTs, 'utf8');
     console.log("Successfully injected keys into ko.ts");
  }
} else {
  console.log("alert: { block already exists in ko.ts");
}
