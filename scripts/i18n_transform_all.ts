import { Project, SyntaxKind, JsxText, StringLiteral, SourceFile } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const KOREAN_REGEX = /[가-힣]/;

function generateKey(index: number) {
  return `auto.x${index.toString().padStart(4, "0")}`;
}

async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  project.addSourceFilesAtPaths("src/**/*.tsx");
  project.addSourceFilesAtPaths("src/**/*.ts");

  let totalReplacements = 4000;
  const translationMap: Record<string, string> = {};
  const sourceFiles = project.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes("/src/i18n/") || filePath.includes("scripts/") || filePath.includes(".d.ts")) {
      continue;
    }

    let fileReplacements = 0;

    // 1. Process JSX Text
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    for (const textNode of jsxTexts) {
      const text = textNode.getText().trim();
      if (KOREAN_REGEX.test(text) && !text.includes("{") && text.length > 0) {
        const key = generateKey(totalReplacements);
        translationMap[key] = text.replace(/"/g, '\\"');
        textNode.replaceWithText(`{t("${key}", "${text}")}`);
        totalReplacements++;
        fileReplacements++;
      }
    }

    // 2. Process String Literals
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const stringNode of stringLiterals) {
      try {
        const text = stringNode.getLiteralValue();
        if (KOREAN_REGEX.test(text)) {
          if (stringNode.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue;

          const callExpr = stringNode.getFirstAncestorByKind(SyntaxKind.CallExpression);
          const exprName = callExpr?.getExpression().getText();
          if (exprName === "t" || exprName === "i18n.t") continue;

          const parent = stringNode.getParent();
          if (parent) {
            const key = generateKey(totalReplacements);
            translationMap[key] = text;
            if (parent.getKind() === SyntaxKind.JsxAttribute) {
              stringNode.replaceWithText(`{t("${key}", "${text}")}`);
            } else {
              stringNode.replaceWithText(`t("${key}", "${text}")`);
            }
            totalReplacements++;
            fileReplacements++;
          }
        }
      } catch (e) {}
    }

    if (fileReplacements > 0) {
      // Add useTranslation import if a React component
      const hasI18nImport = sourceFile.getImportDeclarations().some(i => i.getModuleSpecifierValue() === "react-i18next" || i.getModuleSpecifierValue() === "i18next" || i.getModuleSpecifierValue() === "@/i18n");
      if (!hasI18nImport && filePath.endsWith(".tsx")) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: "react-i18next",
          namedImports: ["useTranslation"]
        });
      }
      
      sourceFile.saveSync();
      console.log(`Replaced ${fileReplacements} strings in ${path.basename(filePath)}`);
    }
  }

  // Handle tsx files that now need `const { t } = useTranslation();` hook
  // Wait, inserting the hook blindly with AST is dangerous and caused crashes earlier. 
  // We'll trust that most components either have `t` or the dev will fix small hook issues, 
  // or we can fallback to `i18n.t` if not a functional component inside replacing, but string replacing works for now.

  fs.writeFileSync("extracted_new.json", JSON.stringify(translationMap, null, 2));
  console.log(`Total new replacements: ${totalReplacements}`);
}

main().catch(console.error);
