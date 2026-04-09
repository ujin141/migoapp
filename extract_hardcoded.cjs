const { Project, SyntaxKind } = require('ts-morph');
const project = new Project({ tsConfigFilePath: './tsconfig.json' });

let hardcodedCount = 0;
const koreanRegex = /[\u3131-\uD79D]/;

project.getSourceFiles('src/**/*.{ts,tsx}').forEach(sourceFile => {
  const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);

  const texts = [...jsxTexts, ...stringLiterals];
  texts.forEach(node => {
     const text = node.getText();
     if (koreanRegex.test(text)) {
        // Check if parent is a CallExpression for 't' or 'i18n.t'
        let isTranslated = false;
        let parent = node.getParent();
        while (parent && parent.getKind() !== SyntaxKind.SourceFile) {
            if (parent.getKind() === SyntaxKind.CallExpression) {
                const exprText = parent.getExpression()?.getText();
                if (exprText === 't' || exprText === 'i18n.t') {
                    isTranslated = true;
                    break;
                }
            }
            // Check if it's inside console.log or Error
            if (parent.getKind() === SyntaxKind.CallExpression) {
                const exprText = parent.getExpression()?.getText();
                if (exprText?.includes('console') || exprText === 'Error') {
                    isTranslated = true; // skip logs/errors
                    break;
                }
            }
            parent = parent.getParent();
        }
        if (!isTranslated) {
            console.log(sourceFile.getFilePath() + ' === ' + text);
            hardcodedCount++;
        }
     }
  });
});
console.log('Total hardcoded Korean nodes: ' + hardcodedCount);
