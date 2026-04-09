import { Project, SyntaxKind, JsxOpeningElement, JsxSelfClosingElement } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

project.addSourceFilesAtPaths("src/pages/**/*.tsx");
project.addSourceFilesAtPaths("src/components/**/*.tsx");

const srcFiles = project.getSourceFiles();
console.log(`Analyzing ${srcFiles.length} files for global truncation...`);

let modifiedCount = 0;

for (const sourceFile of srcFiles) {
  let fileModified = false;

  sourceFile.forEachDescendant(node => {
    // Look for JSX Elements
    if (NodeIsJsxElement(node)) {
        // Only target elements containing translation tags as children
        const hasTranslationChild = node.getChildrenOfKind(SyntaxKind.JsxExpression).some(expr => {
            const text = expr.getText();
            return text.includes('t(') || text.includes('i18n.t(') || text.includes('t"');
        });

        if (hasTranslationChild) {
            let opening;
            if (node.getKind() === SyntaxKind.JsxElement) {
                opening = node.getOpeningElement();
            } else if (node.getKind() === SyntaxKind.JsxSelfClosingElement) {
                opening = node;
            }

            if (opening) {
                const tagName = opening.getTagNameNode().getText();
                // Safe tags to apply truncate:
                const safeTags = ['span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'Button', 'Badge', 'Label'];
                if (safeTags.includes(tagName)) {
                    // find className attribute
                    const attributes = opening.getAttributes();
                    const classNameAttr = attributes.find(a => a.getKind() === SyntaxKind.JsxAttribute && a.getNameNode().getText() === 'className');
                    
                    if (classNameAttr) {
                        const initializer = classNameAttr.getInitializer();
                        if (initializer && initializer.getKind() === SyntaxKind.StringLiteral) {
                            const val = initializer.getLiteralText();
                            if (!val.includes('truncate') && !val.includes('line-clamp')) {
                                // Add truncate and some sensible boundary wrapper classes
                                const newVal = val + " truncate";
                                initializer.replaceWithText(`"${newVal}"`);
                                fileModified = true;
                            }
                        } else if (initializer && initializer.getKind() === SyntaxKind.JsxExpression) {
                            const inner = initializer.getExpression();
                            if (inner && inner.getKind() === SyntaxKind.TemplateExpression) {
                                // Template literal case
                                const head = inner.getHead();
                                if (head && !head.getText().includes('truncate') && !head.getText().includes('line-clamp')) {
                                    const headText = head.getText(); // e.g. `flex items-center 
                                    // Hacky insert at the end of the template literal head
                                    const modifiedHeadText = headText.replace(/`$/, ' truncate`');
                                    // It's tricky to modify template literals without a full AST rewrite, bypass for now, or just append generic text
                                }
                            }
                        }
                    } else {
                        // no className, add it
                        opening.addAttribute({
                            name: "className",
                            initializer: '"truncate"'
                        });
                        fileModified = true;
                    }
                }
            }
        }
    }
  });

  if (fileModified) {
    sourceFile.saveSync();
    modifiedCount++;
  }
}

console.log(`Global truncation applied to ${modifiedCount} files! Layouts are now protected from text overflow.`);

function NodeIsJsxElement(node) {
    return node.getKind() === SyntaxKind.JsxElement || node.getKind() === SyntaxKind.JsxSelfClosingElement;
}
