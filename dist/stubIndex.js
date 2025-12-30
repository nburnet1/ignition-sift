"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StubIndex = void 0;
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
class StubIndex {
    constructor() {
        this.symbols = new Map();
    }
    rebuild(_context) {
        this.symbols.clear();
        var workspace = vscode.workspace.workspaceFolders;
        if (!workspace || workspace.length === 0) {
            return;
        }
        var stubDir = vscode.workspace
            .getConfiguration("ignitionSift")
            .get("stubDir", ".stubs");
        var root = path.join(workspace[0].uri.fsPath, stubDir);
        if (!fs.existsSync(root)) {
            return;
        }
        this.walk(root, root);
    }
    walk(root, dir) {
        var entries = fs.readdirSync(dir, { withFileTypes: true });
        for (var i = 0; i < entries.length; i += 1) {
            var ent = entries[i];
            var abs = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                this.walk(root, abs);
            }
            else if (ent.isFile() && abs.endsWith(".pyi")) {
                this.indexFile(root, abs);
            }
        }
    }
    indexFile(root, file) {
        var rel = path.relative(root, file).replace(/\\/g, "/");
        var modulePath = rel
            .replace(/\.pyi$/, "")
            .replace(/\/__init__$/, "")
            .split("/")
            .filter(Boolean)
            .join(".");
        var lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
        for (var i = 0; i < lines.length; i += 1) {
            var line = lines[i];
            // 🚫 ignore indented lines (methods, inner defs)
            if (/^\s+/.test(line)) {
                continue;
            }
            var m = line.match(/^(class|def)\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
            if (!m) {
                continue;
            }
            var name = m[2];
            var list = this.symbols.get(name) || [];
            list.push(modulePath);
            this.symbols.set(name, list);
        }
    }
    /** Exact lookup */
    lookup(name) {
        return this.symbols.get(name) || [];
    }
    /** Case-insensitive prefix lookup */
    prefixLookup(prefix, minLength) {
        var results = new Map();
        if (prefix.length < minLength) {
            return results;
        }
        var needle = prefix.toLowerCase();
        for (var entry of this.symbols.entries()) {
            var symbol = entry[0];
            var modules = entry[1];
            if (symbol.toLowerCase().startsWith(needle)) {
                results.set(symbol, modules);
            }
        }
        return results;
    }
}
exports.StubIndex = StubIndex;
//# sourceMappingURL=stubIndex.js.map