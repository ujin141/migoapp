import fs from 'fs';
const extracted = JSON.parse(fs.readFileSync('extracted_babel.json', 'utf8'));

let koTs = fs.readFileSync('src/i18n/locales/ko.ts', 'utf8');

// We just append autoBabel: { ...extracted... } to the end of the object.
// Wait, we need to carefully match export default ko; or the end of the object.
const entries = Object.entries(extracted).map(([k, v]) => `    "${k}": ${JSON.stringify(v)},`).join('\n');
const injection = `  auto: {\n${entries}\n  }\n};\nexport default ko;`;

// wait, 'auto' already exists in ko.ts from previous extraction.
// We will name it 'auto2' instead so merge_ko.mjs can merge it.
const babelInjection = `  "auto2": {\n${entries}\n  }\n};\nexport default ko;`;

if (!koTs.includes('"auto2": {')) {
  // Assuming the file ends with:
  //   },
  //   auto: {
  //     ...
  //   }
  // };
  // export default ko;
  
  koTs = koTs.replace(/};\s*export\s+default\s+ko;/g, `},\n${babelInjection}`);
  fs.writeFileSync('src/i18n/locales/ko.ts', koTs, 'utf8');
  console.log("Injected babel object into ko.ts successfully.");
} else {
  console.log("babel block already exists in ko.ts");
}
