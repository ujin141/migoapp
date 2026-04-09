import { Project, SyntaxKind } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.addSourceFilesAtPaths("src/pages/**/*.tsx");
project.addSourceFilesAtPaths("src/components/**/*.tsx");
project.addSourceFilesAtPaths("src/pages/**/*.ts");
project.addSourceFilesAtPaths("src/components/**/*.ts");

const srcFiles = project.getSourceFiles();
console.log(`Starting deep AST nuclear extraction on ${srcFiles.length} files...`);

let keyCount = 9000;
const newKeys = {};
const KO_REGEX = /[가-힣]/;

for (const sourceFile of srcFiles) {
  let fileModified = false;
  
  sourceFile.forEachDescendant((node) => {
    // 1. JSX 원시 텍스트 (e.g. <div>안녕하세요</div>) 추출
    if (node.getKind() === SyntaxKind.JsxText) {
      let rawText = node.getText();
      let cleanText = node.getLiteralText().trim();
      
      if (KO_REGEX.test(cleanText) && !rawText.includes("t(") && !rawText.includes("i18n.t")) {
        const newKey = `deep.t_${keyCount++}`;
        newKeys[newKey] = cleanText;
        
        const match = rawText.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const prefix = match ? match[1] : '';
        const suffix = match ? match[3] : '';
        
        node.replaceWithText(`${prefix}{i18n.t("${newKey}", \`${cleanText.replace(/`/g, '\\`')}\`)}${suffix}`);
        fileModified = true;
      }
    }
    
    // 2. JSX 속성 내 문자열 (e.g. placeholder="안녕", title="안녕") 추출
    if (node.getKind() === SyntaxKind.StringLiteral) {
      const parent = node.getParent();
      // Only target JsxAttribute strings (we skip import paths etc)
      if (parent && parent.getKind() === SyntaxKind.JsxAttribute) {
         let cleanText = node.getLiteralText().trim();
         if (KO_REGEX.test(cleanText) && !cleanText.includes("t(") && !cleanText.includes("i18n.t")) {
            const newKey = `deep.t_${keyCount++}`;
            newKeys[newKey] = cleanText;
            
            node.replaceWithText(`{i18n.t("${newKey}", \`${cleanText.replace(/`/g, '\\`')}\`)}`);
            fileModified = true;
         }
      }
    }
  });

  if (fileModified) {
    // 상단에 i18n import 시도 (이미 있으면 넘어감)
    let hasImport = false;
    sourceFile.getImportDeclarations().forEach(imp => {
      const moduleSpecifier = imp.getModuleSpecifierValue();
      if (moduleSpecifier === "@/i18n" || moduleSpecifier.endsWith("i18n/index") || moduleSpecifier.endsWith("i18n")) {
         hasImport = true;
      }
    });
    
    if (!hasImport) {
       sourceFile.insertImportDeclaration(0, {
          defaultImport: "i18n",
          moduleSpecifier: "@/i18n"
       });
    }

    try {
      sourceFile.saveSync();
      console.log(`Deep Patched: ${sourceFile.getBaseName()}`);
    } catch(e) {
      console.error(`Failed to save ${sourceFile.getBaseName()}`);
    }
  }
}

// 3. 추출된 키들을 ko.ts 메인 단어장에 자동 삽입
if (Object.keys(newKeys).length > 0) {
  const koPath = path.join(process.cwd(), "src/i18n/locales/ko.ts");
  if (fs.existsSync(koPath)) {
    let koContent = fs.readFileSync(koPath, "utf-8");
    
    let appendStr = "";
    for (const [k, v] of Object.entries(newKeys)) {
        appendStr += `  "${k}": "${v.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",\n`;
    }
    
    const lastBraceIdx = koContent.lastIndexOf("}");
    if (lastBraceIdx !== -1) {
        koContent = koContent.slice(0, lastBraceIdx) + ",\n" + appendStr + koContent.slice(lastBraceIdx);
        koContent = koContent.replace(/,\s*,/g, ',');
        fs.writeFileSync(koPath, koContent, "utf8");
        console.log(`\nSuccess! Injected ${Object.keys(newKeys).length} deep hidden keys directly into ko.ts!`);
    }
  }
} else {
  console.log("\nPerfect! No hidden raw strings found. Already 100% wrapped.");
}
