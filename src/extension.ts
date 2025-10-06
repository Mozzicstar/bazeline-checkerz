import * as vscode from 'vscode';
import { scanDocument } from './scanner';
import { fallbackDB } from './fallbacks';

let diagnosticCollection: vscode.DiagnosticCollection;
let scanTimeout: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext) {
  diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('baselineChecker.checkFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        performScan(editor.document);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('baselineChecker.suggestFallback', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      
      const position = editor.selection.active;
      const diagnostics = diagnosticCollection.get(editor.document.uri);
      
      if (diagnostics) {
        const diagnostic = diagnostics.find(d => d.range.contains(position));
        if (diagnostic && diagnostic.code) {
          const featureId = diagnostic.code.toString();
          const fallback = fallbackDB[featureId];
          
          if (fallback) {
            await vscode.window.showInformationMessage(
              `${fallback.friendlyName}: ${fallback.explanation}`,
              'Copy Fallback'
            ).then(selection => {
              if (selection === 'Copy Fallback') {
                vscode.env.clipboard.writeText(fallback.fallback);
                vscode.window.showInformationMessage('Fallback copied to clipboard!');
              }
            });
          }
        }
      }
    })
  );

  // Register hover provider
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(['css', 'scss', 'less', 'html'], {
      provideHover(document, position) {
        const diagnostics = diagnosticCollection.get(document.uri);
        if (!diagnostics) return null;

        const diagnostic = diagnostics.find(d => d.range.contains(position));
        if (!diagnostic || !diagnostic.code) return null;

        const featureId = diagnostic.code.toString();
        const fallback = fallbackDB[featureId];
        
        if (fallback) {
          const markdown = new vscode.MarkdownString();
          markdown.appendMarkdown(`**${fallback.friendlyName}**\n\n`);
          markdown.appendMarkdown(`⚠️ ${fallback.explanation}\n\n`);
          markdown.appendMarkdown(`**Fallback:**\n\`\`\`\n${fallback.fallback}\n\`\`\`\n\n`);
          markdown.isTrusted = true;
          return new vscode.Hover(markdown);
        }
        
        return null;
      }
    })
  );

  // Scan on open
  vscode.workspace.onDidOpenTextDocument(doc => {
    if (vscode.workspace.getConfiguration('baselineChecker').get('enableOnOpen')) {
      performScan(doc);
    }
  });

  // Scan on change (debounced)
  vscode.workspace.onDidChangeTextDocument(event => {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => performScan(event.document), 500);
  });

  // Scan visible editors
  vscode.window.visibleTextEditors.forEach(editor => {
    performScan(editor.document);
  });
}

function performScan(document: vscode.TextDocument) {
  const supportedLanguages = ['css', 'scss', 'less', 'html'];
  if (!supportedLanguages.includes(document.languageId)) {
    return;
  }

  const issues = scanDocument(document);
  const diagnostics: vscode.Diagnostic[] = [];

  for (const issue of issues) {
    const diagnostic = new vscode.Diagnostic(
      issue.range,
      `⚠️ '${issue.featureName}' not baseline-ready (Baseline: ${issue.baseline || 'N/A'})`,
      vscode.DiagnosticSeverity.Warning
    );
    diagnostic.code = issue.featureId;
    diagnostic.source = 'baseline-checker';
    diagnostics.push(diagnostic);
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() {
  if (diagnosticCollection) {
    diagnosticCollection.dispose();
  }
}