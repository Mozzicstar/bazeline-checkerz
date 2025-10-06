import * as vscode from 'vscode';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

interface Issue {
  featureId: string;
  featureName: string;
  baseline: string | null;
  range: vscode.Range;
}

const FEATURES = {
  ':has': {
    id: 'css-has-pseudo',
    name: ':has()',
    baseline: '2023'
  },
  'backdrop-filter': {
    id: 'css-backdrop-filter',
    name: 'backdrop-filter',
    baseline: '2022'
  }
};

export function scanDocument(document: vscode.TextDocument): Issue[] {
  const issues: Issue[] = [];
  const text = document.getText();

  if (document.languageId === 'css' || document.languageId === 'scss' || document.languageId === 'less') {
    issues.push(...scanCSS(text, document));
  }

  if (document.languageId === 'html') {
    issues.push(...scanHTML(text, document));
  }

  return issues;
}

function scanCSS(text: string, document: vscode.TextDocument): Issue[] {
  const issues: Issue[] = [];

  try {
    const root = postcss.parse(text);

    // Check for :has() selector
    root.walkRules(rule => {
      try {
        selectorParser(selectors => {
          selectors.walkPseudos(pseudo => {
            if (pseudo.value === ':has') {
              const line = rule.source?.start?.line || 1;
              const col = rule.source?.start?.column || 1;
              const startPos = new vscode.Position(line - 1, col - 1);
              const endPos = new vscode.Position(line - 1, col + rule.selector.length);
              
              issues.push({
                featureId: FEATURES[':has'].id,
                featureName: FEATURES[':has'].name,
                baseline: FEATURES[':has'].baseline,
                range: new vscode.Range(startPos, endPos)
              });
            }
          });
        }).processSync(rule.selector);
      } catch (e) {
        // Skip malformed selectors
      }
    });

    // Check for backdrop-filter property
    root.walkDecls('backdrop-filter', decl => {
      const line = decl.source?.start?.line || 1;
      const col = decl.source?.start?.column || 1;
      const startPos = new vscode.Position(line - 1, col - 1);
      const endPos = new vscode.Position(line - 1, col + decl.prop.length);
      
      issues.push({
        featureId: FEATURES['backdrop-filter'].id,
        featureName: FEATURES['backdrop-filter'].name,
        baseline: FEATURES['backdrop-filter'].baseline,
        range: new vscode.Range(startPos, endPos)
      });
    });

  } catch (e) {
    // Silently skip parse errors
  }

  return issues;
}

function scanHTML(text: string, document: vscode.TextDocument): Issue[] {
  const issues: Issue[] = [];
  
  // Simple regex for backdrop-filter in style attributes
  const styleRegex = /style\s*=\s*["']([^"']*)backdrop-filter[^"']*["']/gi;
  let match;
  
  while ((match = styleRegex.exec(text)) !== null) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    
    issues.push({
      featureId: FEATURES['backdrop-filter'].id,
      featureName: FEATURES['backdrop-filter'].name,
      baseline: FEATURES['backdrop-filter'].baseline,
      range: new vscode.Range(startPos, endPos)
    });
  }

  return issues;
}