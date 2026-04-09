const { Project, SyntaxKind } = require('ts-morph');
const project = new Project({ tsConfigFilePath: './tsconfig.json' });

let hardcodedCount = 0;
const koreanRegex = /[\u3131-\uD79D]/;

// A recursive function to check if a node is inside a safe call expression like t() or console.log()
function isInsideSafeFunction(node) {
    let parent = node.getParent();
    while (parent && parent.getKind() !== SyntaxKind.SourceFile) {
        if (parent.getKind() === SyntaxKind.CallExpression) {
            const exprText = parent.getExpression()?.getText();
            if (exprText === 't' || 
                exprText === 'i18n.t' || 
                exprText?.includes('console') ||
                exprText === 'Error') {
                return true;
            }
        }
        parent = parent.getParent();
    }
    return false;
}

project.getSourceFiles('src/**/*.{ts,tsx}').forEach(sourceFile => {
  // Find all literals that might contain text
  const textNodes = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxText),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.TemplateHead),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.TemplateMiddle),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.TemplateTail)
  ];

  textNodes.forEach(node => {
     const text = node.getText();
     if (koreanRegex.test(text)) {
        if (!isInsideSafeFunction(node)) {
            console.log(sourceFile.getFilePath() + ' ===> ' + text);
            hardcodedCount++;
        }
     }
  });
});
console.log('Total genuinely missed hardcoded Korean nodes: ' + hardcodedCount);
