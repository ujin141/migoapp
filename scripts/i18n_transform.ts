import { Project, SyntaxKind, JsxText, StringLiteral, TemplateExpression, SourceFile, Node } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const KOREAN_REGEX = /[가-힣]/;

function generateKey(index: number) {
  return `auto.ko_${index.toString().padStart(4, "0")}`;
}

async function addUseTranslationHook(sourceFile: SourceFile) {
  // Check if react-i18next is imported
  const imports = sourceFile.getImportDeclarations();
  const hasI18nImport = imports.some(i => i.getModuleSpecifierValue() === "react-i18next");
  
  if (!hasI18nImport) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "react-i18next",
      namedImports: ["useTranslation"]
    });
  }

  // Find the primary React component in the file
  let compFound = false;
  
  // Look for exported variable default or named
  const varDecls = sourceFile.getVariableDeclarations();
  for (const decl of varDecls) {
    const init = decl.getInitializer();
    if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
      // Check if it returns JSX
      const block = init.getFirstDescendantByKind(SyntaxKind.Block);
      const returnsJsx = block?.getDescendantsOfKind(SyntaxKind.ReturnStatement).some(r => r.getExpression()?.getKind() === SyntaxKind.ParenthesizedExpression || r.getExpression()?.getKind() === SyntaxKind.JsxElement || r.getExpression()?.getKind() === SyntaxKind.JsxFragment);
      
      const parenReturn = init.getFirstDescendantByKind(SyntaxKind.ParenthesizedExpression);
      
      if (returnsJsx || parenReturn) {
        if (!decl.getText().includes('useTranslation()')) {
          // It's a React component, try to inject hook if block
          if (block) {
            block.insertStatements(0, "const { t } = useTranslation();");
          }
        }
        compFound = true;
      }
    }
  }
}

async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
  });

  project.addSourceFilesAtPaths("src/**/*.tsx");
  project.addSourceFilesAtPaths("src/**/*.ts");

  const filesToProcess = [
    "src/pages/DiscoverPage.tsx",
    "src/pages/MapPage.tsx",
    "src/pages/MatchPage.tsx",
    "src/components/GroupCreateModal.tsx",
    "src/pages/match/TripMatchModals.tsx",
    "src/components/LanguagePicker.tsx",
    "src/components/BottomNav.tsx"
  ];

  let totalReplacements = 0;
  const translationMap: Record<string, string> = {};

  for (const filePath of filesToProcess) {
    const filename = path.basename(filePath);
    const sourceFile = project.getSourceFile(f => f.getFilePath().endsWith(filename));
    if (!sourceFile) {
      console.log(`Skipping ${filePath} (Not found in ${project.getSourceFiles().length} files)`);
      continue;
    }

    console.log(`Processing ${filePath}...`);
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

    // 2. Process String Literals inside JSX Attributes (e.g. placeholder="한글")
    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    for (const stringNode of stringLiterals) {
      try {
        const text = stringNode.getLiteralValue();
        if (KOREAN_REGEX.test(text)) {
          // Skip if inside import declaration
          if (stringNode.getFirstAncestorByKind(SyntaxKind.ImportDeclaration)) continue;

          const callExpr = stringNode.getFirstAncestorByKind(SyntaxKind.CallExpression);
          const exprName = callExpr?.getExpression().getText();
          if (exprName === "t" || exprName === "i18n.t" || exprName === "toast") {
            continue;
          }

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
      } catch (e) {
        console.error("Failed on a node, skipping.");
      }
    }

    if (fileReplacements > 0) {
      sourceFile.saveSync();
      console.log(`  -> Replaced ${fileReplacements} strings in ${filePath}`);
    } else {
      console.log(`  -> No replacements in ${filePath}`);
    }
  }

  fs.writeFileSync("extracted_i18n_keys.json", JSON.stringify(translationMap, null, 2));
  console.log(`Total strings replaced: ${totalReplacements}`);
  console.log('Saved keys to extracted_i18n_keys.json');
}

main().catch(console.error);
