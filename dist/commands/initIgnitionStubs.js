"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initIgnitionStubs = initIgnitionStubs;
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
async function initIgnitionStubs(context) {
    var output = vscode.window.createOutputChannel("ignition-sift");
    output.show(true);
    var config = vscode.workspace.getConfiguration("ignitionSift");
    var stubDir = config.get("stubDir", ".stubs");
    var workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length === 0) {
        output.appendLine("❌ No workspace folder found");
        return;
    }
    var workspaceRoot = workspace[0].uri.fsPath;
    var destRoot = path.join(workspaceRoot, stubDir);
    var srcRoot = path.join(context.extensionPath, ".stubs");
    output.appendLine("Initializing Ignition stubs");
    output.appendLine("Source: " + srcRoot);
    output.appendLine("Destination: " + destRoot);
    if (!fs.existsSync(srcRoot)) {
        output.appendLine("❌ Built-in stubs directory not found");
        return;
    }
    copyDirectory(srcRoot, destRoot, output);
    output.appendLine("✅ Ignition stubs initialized");
}
function copyDirectory(src, dest, output) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    var entries = fs.readdirSync(src, { withFileTypes: true });
    for (var entry of entries) {
        var srcPath = path.join(src, entry.name);
        var destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath, output);
            continue;
        }
        if (!entry.isFile()) {
            continue;
        }
        if (fs.existsSync(destPath)) {
            // do not overwrite user stubs
            continue;
        }
        fs.copyFileSync(srcPath, destPath);
        output.appendLine("Copied: " + destPath);
    }
}
//# sourceMappingURL=initIgnitionStubs.js.map