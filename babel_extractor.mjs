import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import * as babel from '@babel/core';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;
const t = babel.types;

const koreanRegex = /[가-힣]/;

// Track extracted dictionary
const extractedDict = {};
let keyCounter = 1;

function generateKey(text) {
  const shortText = text.replace(/[^가-힣a-zA-Z0-9]/g, '').substring(0, 10);
  return `z_${shortText}_${keyCounter++}`;
}

const files = globSync('src/**/*.{ts,tsx}', { ignore: ['src/i18n/**', 'src/components/ui/**'] });

let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!koreanRegex.test(content)) continue;

  const ast = parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  let needsUseTranslation = false;
  let needsI18n = false;
  let hasI18nImport = false;
  let hasUseTranslationImport = false;
  const functionsToInject = new Set();
  
  // Find imports
  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === '@/i18n') hasI18nImport = true;
      if (path.node.source.value === 'react-i18next') hasUseTranslationImport = true;
    }
  });

  traverse(ast, {
    StringLiteral(path) {
      // Exclude imports, jsx attributes that shouldn't be translated like className
      if (path.parent.type === 'ImportDeclaration') return;
      if (path.parent.type === 'JSXAttribute') {
         const name = path.parent.name.name;
         if (['className', 'd', 'fill', 'stroke', 'id', 'name', 'type', 'to', 'href', 'src', 'alt', 'target', 'rel'].includes(name)) return;
      }
      if (path.parent.type === 'ObjectProperty' && path.parent.key === path.node) return;

      if (koreanRegex.test(path.node.value)) {
        const text = path.node.value;
        const key = generateKey(text);
        extractedDict[key] = text;

        const fnParent = path.getFunctionParent();
        const isReactFn = fnParent && fnParent.node.id && /^[A-Z]|^use[A-Z]/.test(fnParent.node.id.name) 
                          || (fnParent && fnParent.parent.type === 'VariableDeclarator' && /^[A-Z]|^use[A-Z]/.test(fnParent.parent.id.name));

        let callExpr;
        if (isReactFn) {
          needsUseTranslation = true;
          functionsToInject.add(fnParent.node);
          callExpr = t.callExpression(t.identifier('t'), [t.stringLiteral(`auto.${key}`)]);
        } else {
          needsI18n = true;
          callExpr = t.callExpression(
            t.memberExpression(t.identifier('i18n'), t.identifier('t')),
            [t.stringLiteral(`auto.${key}`)]
          );
        }

        if (path.parent.type === 'JSXAttribute') {
          path.replaceWith(t.jsxExpressionContainer(callExpr));
        } else {
          path.replaceWith(callExpr);
        }
        path.skip();
        totalReplaced++;
      }
    },
    JSXText(path) {
      if (koreanRegex.test(path.node.value)) {
         const text = path.node.value.trim();
         if (!text) return;
         
         const key = generateKey(text);
         extractedDict[key] = text;

         const fnParent = path.getFunctionParent();
         const isReactFn = fnParent && fnParent.node.id && /^[A-Z]|^use[A-Z]/.test(fnParent.node.id.name) 
                           || (fnParent && fnParent.parent.type === 'VariableDeclarator' && /^[A-Z]|^use[A-Z]/.test(fnParent.parent.id.name));

         let callExpr;
         if (isReactFn) {
           needsUseTranslation = true;
           functionsToInject.add(fnParent.node);
           callExpr = t.callExpression(t.identifier('t'), [t.stringLiteral(`auto.${key}`)]);
         } else {
           needsI18n = true;
           callExpr = t.callExpression(
             t.memberExpression(t.identifier('i18n'), t.identifier('t')),
             [t.stringLiteral(`auto.${key}`)]
           );
         }

         path.replaceWith(t.jsxExpressionContainer(callExpr));
         path.skip();
         totalReplaced++;
      }
    },
    TemplateLiteral(path) {
      if (koreanRegex.test(path.node.quasis.map(q => q.value.raw).join(''))) {
        // Leave template literals alone if too complex, or rewrite to t()?
        // It's easier to just use t() entirely by rewriting template to a single t() key if it only has strings,
        // but it has expressions. Let's just wrap the WHOLE template literal as defaultValue in t!?
        // No, you can't pass a JS expression as a defaultValue easily if we don't extract the exact template.
        // Let's just wrap the entire template literal in t("key", { defaultValue: `...` } })? NO! i18next defaultValue string cannot have dynamic values unless it's predefined.
        // However, if we just use `t(\`auto.tempKey\`, { defaultValue: \`\${foo} 한글\` })`, i18next WILL return the defaultValue if missing! Yes!
        
        const key = `z_tmpl_${keyCounter++}`;
        extractedDict[key] = "TEMPLATE_LITERAL_MAPPED";

        const fnParent = path.getFunctionParent();
        const isReactFn = fnParent && fnParent.node.id && /^[A-Z]|^use[A-Z]/.test(fnParent.node.id.name) 
                          || (fnParent && fnParent.parent.type === 'VariableDeclarator' && /^[A-Z]|^use[A-Z]/.test(fnParent.parent.id.name));

        const objExpr = t.objectExpression([
          t.objectProperty(t.identifier('defaultValue'), path.node) // pass the original template as defaultValue!
        ]);

        let callExpr;
        if (isReactFn) {
          needsUseTranslation = true;
          functionsToInject.add(fnParent.node);
          callExpr = t.callExpression(t.identifier('t'), [t.stringLiteral(`auto.${key}`), objExpr]);
        } else {
          needsI18n = true;
          callExpr = t.callExpression(
            t.memberExpression(t.identifier('i18n'), t.identifier('t')),
            [t.stringLiteral(`auto.${key}`), objExpr]
          );
        }

        path.replaceWith(callExpr);
        path.skip();
        totalReplaced++;
      }
    }
  });

  // Inject useTranslation
  if (needsUseTranslation && functionsToInject.size > 0) {
    traverse(ast, {
      BlockStatement(path) {
        if (functionsToInject.has(path.parent)) {
          // Check if already has useTranslation
          let hasT = false;
          path.node.body.forEach(stmt => {
            if (stmt.type === 'VariableDeclaration' && stmt.declarations[0].id.type === 'ObjectPattern') {
               if (stmt.declarations[0].id.properties.some(p => p.key.name === 't')) hasT = true;
            }
          });
          if (!hasT) {
            path.node.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.objectPattern([t.objectProperty(t.identifier('t'), t.identifier('t'), false, true)]),
                  t.callExpression(t.identifier('useTranslation'), [])
                )
              ])
            );
          }
        }
      }
    });

    if (!hasUseTranslationImport) {
      ast.program.body.unshift(
        t.importDeclaration(
          [t.importSpecifier(t.identifier('useTranslation'), t.identifier('useTranslation'))],
          t.stringLiteral('react-i18next')
        )
      );
    }
  }

  // Inject i18n
  if (needsI18n && !hasI18nImport) {
    // If it's a component or hook file, maybe `@/i18n` or `../i18n` etc. Use `@/i18n`
    ast.program.body.unshift(
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier('i18n'))],
        t.stringLiteral('@/i18n')
      )
    );
  }

  if (needsUseTranslation || needsI18n) {
    const output = generate(ast, { retainLines: false }, content);
    fs.writeFileSync(file, output.code, 'utf8');
  }
}

fs.writeFileSync('extracted_babel.json', JSON.stringify(extractedDict, null, 2), 'utf8');
console.log(`Babel Extraction Complete. Replaced: ${totalReplaced} strings.`);

