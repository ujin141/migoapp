import { Project, SyntaxKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const project = new Project({ tsConfigFilePath: "tsconfig.json" });
project.addSourceFilesAtPaths("src/pages/login/**/*.tsx");
project.addSourceFilesAtPaths("src/pages/ProfileSetupPage.tsx");
project.addSourceFilesAtPaths("src/pages/OnboardingPage.tsx");
project.addSourceFilesAtPaths("src/pages/SplashPage.tsx");
project.addSourceFilesAtPaths("src/App.tsx");
project.addSourceFilesAtPaths("src/components/**/*.tsx");

let filesUpdated = 0;

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath();
  if (filePath.includes("/i18n/")) continue;

  let fileChanged = false;

  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const callExpr of callExprs) {
    const exprName = callExpr.getExpression().getText();
    if (exprName === "t" || exprName === "i18n.t") {
      const args = callExpr.getArguments();
      if (args.length >= 2) {
        // If the first argument is a string literal starting with 'auto.'
        const firstArg = args[0];
        if (firstArg.getKind() === SyntaxKind.StringLiteral || firstArg.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
          // Just remove the second argument completely!
          // t('auto.g_xxx', '한국어') -> t('auto.g_xxx')
          
          const text = firstArg.getText(); // e.g. "auto.g_1234"
          if (text.includes("auto.") || text.includes("splash.") || text.includes("login.") || text.includes("profileSetup.")) {
             callExpr.removeArgument(1);
             fileChanged = true;
          }
        }
      }
    }
  }

  if (fileChanged) {
    sourceFile.saveSync();
    filesUpdated++;
    console.log(`Removed fallbacks in ${path.basename(filePath)}`);
  }
}

console.log(`Updated ${filesUpdated} files.`);
