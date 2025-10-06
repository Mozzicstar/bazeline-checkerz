"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const scanner_1 = require("./scanner");
const fallbacks_1 = require("./fallbacks");
let diagnosticCollection;
let scanTimeout;
function activate(context) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline');
    context.subscriptions.push(diagnosticCollection);
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand('baselineChecker.checkFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            performScan(editor.document);
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('baselineChecker.suggestFallback', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const position = editor.selection.active;
        const diagnostics = diagnosticCollection.get(editor.document.uri);
        if (diagnostics) {
            const diagnostic = diagnostics.find(d => d.range.contains(position));
            if (diagnostic && diagnostic.code) {
                const featureId = diagnostic.code.toString();
                const fallback = fallbacks_1.fallbackDB[featureId];
                if (fallback) {
                    await vscode.window.showInformationMessage(`${fallback.friendlyName}: ${fallback.explanation}`, 'Copy Fallback').then(selection => {
                        if (selection === 'Copy Fallback') {
                            vscode.env.clipboard.writeText(fallback.fallback);
                            vscode.window.showInformationMessage('Fallback copied to clipboard!');
                        }
                    });
                }
            }
        }
    }));
    // Register hover provider
    context.subscriptions.push(vscode.languages.registerHoverProvider(['css', 'scss', 'less', 'html'], {
        provideHover(document, position) {
            const diagnostics = diagnosticCollection.get(document.uri);
            if (!diagnostics)
                return null;
            const diagnostic = diagnostics.find(d => d.range.contains(position));
            if (!diagnostic || !diagnostic.code)
                return null;
            const featureId = diagnostic.code.toString();
            const fallback = fallbacks_1.fallbackDB[featureId];
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
    }));
    // Scan on open
    vscode.workspace.onDidOpenTextDocument(doc => {
        if (vscode.workspace.getConfiguration('baselineChecker').get('enableOnOpen')) {
            performScan(doc);
        }
    });
    // Scan on change (debounced)
    vscode.workspace.onDidChangeTextDocument(event => {
        if (scanTimeout)
            clearTimeout(scanTimeout);
        scanTimeout = setTimeout(() => performScan(event.document), 500);
    });
    // Scan visible editors
    vscode.window.visibleTextEditors.forEach(editor => {
        performScan(editor.document);
    });
}
function performScan(document) {
    const supportedLanguages = ['css', 'scss', 'less', 'html'];
    if (!supportedLanguages.includes(document.languageId)) {
        return;
    }
    const issues = (0, scanner_1.scanDocument)(document);
    const diagnostics = [];
    for (const issue of issues) {
        const diagnostic = new vscode.Diagnostic(issue.range, `⚠️ '${issue.featureName}' not baseline-ready (Baseline: ${issue.baseline || 'N/A'})`, vscode.DiagnosticSeverity.Warning);
        diagnostic.code = issue.featureId;
        diagnostic.source = 'baseline-checker';
        diagnostics.push(diagnostic);
    }
    diagnosticCollection.set(document.uri, diagnostics);
}
function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}
//# sourceMappingURL=extension.js.map