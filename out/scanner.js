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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDocument = scanDocument;
const vscode = __importStar(require("vscode"));
const postcss_1 = __importDefault(require("postcss"));
const postcss_selector_parser_1 = __importDefault(require("postcss-selector-parser"));
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
function scanDocument(document) {
    const issues = [];
    const text = document.getText();
    if (document.languageId === 'css' || document.languageId === 'scss' || document.languageId === 'less') {
        issues.push(...scanCSS(text, document));
    }
    if (document.languageId === 'html') {
        issues.push(...scanHTML(text, document));
    }
    return issues;
}
function scanCSS(text, document) {
    const issues = [];
    try {
        const root = postcss_1.default.parse(text);
        // Check for :has() selector
        root.walkRules(rule => {
            try {
                (0, postcss_selector_parser_1.default)(selectors => {
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
            }
            catch (e) {
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
    }
    catch (e) {
        // Silently skip parse errors
    }
    return issues;
}
function scanHTML(text, document) {
    const issues = [];
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
//# sourceMappingURL=scanner.js.map