"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAutoImportProvider = registerAutoImportProvider;
const vscode = require("vscode");
/**
 * Return the line index immediately after the module docstring.
 */
function findModuleDocstringEndLine(lines) {
    if (lines.length === 0) {
        return 0;
    }
    var first = lines[0].trim();
    var quote = null;
    if (first.startsWith('"""')) {
        quote = '"""';
    }
    else if (first.startsWith("'''")) {
        quote = "'''";
    }
    else {
        return 0;
    }
    // single-line docstring
    if (first.length > 3 && first.endsWith(quote)) {
        return 1;
    }
    // multi-line docstring
    for (var i = 1; i < lines.length; i += 1) {
        if (lines[i].includes(quote)) {
            return i + 1;
        }
    }
    return 0;
}
/**
 * Find existing `from X import ...`
 */
function findExistingFromImport(lines, modulePath) {
    for (var i = 0; i < lines.length; i += 1) {
        var line = lines[i].trim();
        if (!line.startsWith("from ")) {
            continue;
        }
        var m = line.match(/^from\s+([^\s]+)\s+import\s+(.+)$/);
        if (!m || m[1] !== modulePath) {
            continue;
        }
        var names = m[2]
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        return { line: i, names: names };
    }
    return null;
}
/**
 * Find safe top-level insertion line for imports.
 * Blank lines DO NOT terminate the import block.
 */
function findImportInsertLine(lines) {
    var i = findModuleDocstringEndLine(lines);
    var lastImportLine = -1;
    for (; i < lines.length; i += 1) {
        var raw = lines[i];
        var line = raw.trim();
        // Skip blank lines entirely
        if (line === "") {
            continue;
        }
        // Track imports
        if (line.startsWith("import ") || line.startsWith("from ")) {
            lastImportLine = i;
            continue;
        }
        // First real top-level statement
        break;
    }
    // Insert after the last import if any exist
    if (lastImportLine >= 0) {
        return lastImportLine + 1;
    }
    return i;
}
function registerAutoImportProvider(context, index) {
    var provider = {
        provideCodeActions(doc, _range, ctx) {
            var actions = [];
            var lines = doc.getText().split(/\r?\n/);
            var maxSuggestions = vscode.workspace
                .getConfiguration("ignitionSift")
                .get("maxImportSuggestions", 15);
            for (var i = 0; i < ctx.diagnostics.length; i += 1) {
                var d = ctx.diagnostics[i];
                var word = doc.getText(d.range).trim();
                if (!word || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(word)) {
                    continue;
                }
                // 1️⃣ Exact matches first
                var exactModules = index.lookup(word);
                if (exactModules.length > 0) {
                    for (var em = 0; em < exactModules.length; em += 1) {
                        if (actions.length >= maxSuggestions) {
                            return actions;
                        }
                        createAction(doc, lines, actions, d, word, exactModules[em], false);
                    }
                    continue;
                }
                // 2️⃣ Prefix fallback (case-insensitive, min 3 chars)
                var prefixMatches = index.prefixLookup(word, 3);
                for (var entry of prefixMatches.entries()) {
                    var symbol = entry[0];
                    var modules = entry[1];
                    for (var m = 0; m < modules.length; m += 1) {
                        if (actions.length >= maxSuggestions) {
                            return actions;
                        }
                        createAction(doc, lines, actions, d, symbol, modules[m], true);
                    }
                }
            }
            return actions;
        }
    };
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider("python", provider));
}
function createAction(doc, lines, actions, diagnostic, symbol, modulePath, isPrefix) {
    var title = isPrefix
        ? "Add import (prefix): from " + modulePath + " import " + symbol
        : "Add import: from " + modulePath + " import " + symbol;
    var action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    var edit = new vscode.WorkspaceEdit();
    // 1️⃣ Replace the undefined identifier with the completed symbol
    edit.replace(doc.uri, diagnostic.range, symbol);
    // 2️⃣ Merge or insert import
    var existing = findExistingFromImport(lines, modulePath);
    if (existing) {
        if (existing.names.indexOf(symbol) >= 0) {
            return;
        }
        var newNames = existing.names.concat([symbol]).sort();
        var newLine = "from " + modulePath + " import " + newNames.join(", ");
        edit.replace(doc.uri, new vscode.Range(new vscode.Position(existing.line, 0), new vscode.Position(existing.line, Number.MAX_SAFE_INTEGER)), newLine);
    }
    else {
        var insertLine = findImportInsertLine(lines);
        edit.insert(doc.uri, new vscode.Position(insertLine, 0), "from " + modulePath + " import " + symbol + "\n");
    }
    action.edit = edit;
    action.diagnostics = [diagnostic];
    action.isPreferred = !isPrefix;
    actions.push(action);
}
//# sourceMappingURL=autoImport.js.map