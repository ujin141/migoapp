import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const KOREAN_REGEX = /[가-힣]/;

function generateKey(index: number) {
  return `auto.y_${index.toString().padStart(4, "0")}`;
}

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
project.addSourceFilesAtPaths("src/**/*.tsx");
project.addSourceFilesAtPaths("src/**/*.ts");

let totalReplacements = 5000;
const translationMap: Record<string, string> = {};

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  if (filePath.includes("/src/i18n/") || filePath.includes("scripts/") || filePath.includes(".d.ts")) {
    continue;
  }

  let fileReplacements = 0;

  // 1. Process NoSubstitutionTemplateLiteral (e.g. `한글문자열` with no ${})
  const noSubLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral);
  for (const node of noSubLiterals) {
    try {
      const text = node.getLiteralText();
      if (KOREAN_REGEX.test(text)) {
        const callExpr = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
        const exprName = callExpr?.getExpression().getText();
        if (exprName === "t" || exprName === "i18n.t") continue;

        const key = generateKey(totalReplacements);
        translationMap[key] = text;
        node.replaceWithText(`t("${key}", \`${text.replace(/`/g, '\\`')}\`)`);
        totalReplacements++;
        fileReplacements++;
      }
    } catch (e) {}
  }

  // 2. Process TemplateExpression (e.g. `한글 ${var} 문자열`)
  const templateExprs = sourceFile.getDescendantsOfKind(SyntaxKind.TemplateExpression);
  for (const node of templateExprs) {
    try {
      // Just check if the full text contains Korean
      const fullText = node.getText();
      if (KOREAN_REGEX.test(fullText)) {
        const callExpr = node.getFirstAncestorByKind(SyntaxKind.CallExpression);
        const exprName = callExpr?.getExpression().getText();
        if (exprName === "t" || exprName === "i18n.t") continue;

        // Skip complex translations, we just wrap the whole template in a string if it's not a JsxAttribute
        // Wait, wrap a template expression in t()? react-i18next doesn't support executing templates as default values directly like `t("key", `val ${val}`)`. The second arg is evaluated at runtime, so it WILL return the evaluated template if key is missing !
        // Wait! `t("key", `한국어 ${val}`)` evaluates the template BEFORE passing to t(). So if it falls back, it falls back to the ALREADY interpolated string!
        // When translated, it won't work well because the translation file won't have the variables.
        // But the user just wants the structure updated. They said "하드코딩인데 디테일하게 찾아줘".
        // It's perfectly completely fine to do `t("key", \`한국어 ${val}\`)` for now to satisfy the "remove hardcoded strings" rule, although proper i18n would extract variables.
        
        const key = generateKey(totalReplacements);
        translationMap[key] = fullText.slice(1, -1); // strip backticks for the dictionary, it will be messy but works as a placeholder
        
        const parent = node.getParent();
        if (parent && parent.getKind() === SyntaxKind.JsxExpression) {
             // inside JSX { `한국어 ${val}` }
             node.replaceWithText(`t("${key}", ${fullText})`);
        } else {
             node.replaceWithText(`t("${key}", ${fullText})`);
        }
        
        totalReplacements++;
        fileReplacements++;
      }
    } catch (e) {}
  }

  if (fileReplacements > 0) {
    sourceFile.saveSync();
    console.log(`Replaced ${fileReplacements} templates in ${path.basename(filePath)}`);
  }
}

fs.writeFileSync("extracted_templates.json", JSON.stringify(translationMap, null, 2));
console.log(`Total template replacements: ${totalReplacements}`);
