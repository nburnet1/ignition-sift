"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAllUserStubs = generateAllUserStubs;
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
async function generateAllUserStubs(context) {
    var output = vscode.window.createOutputChannel("ignition-sift");
    output.show(true);
    var config = vscode.workspace.getConfiguration("ignitionSift");
    var pythonPath = config.get("pythonPath", "python3");
    var stubGenerator = config.get("stubGenerator", "builtin");
    var stubDir = config.get("stubDir", ".stubs");
    var workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length === 0) {
        output.appendLine("❌ No workspace folder found");
        return;
    }
    var workspaceRoot = workspace[0].uri.fsPath;
    var generatorPath = stubGenerator === "builtin"
        ? path.join(context.extensionPath, "python", "builtin_stubgen.py")
        : path.join(workspaceRoot, stubGenerator);
    output.appendLine("Generating user stubs");
    output.appendLine("Python: " + pythonPath);
    output.appendLine("Generator: " + generatorPath);
    var files = await vscode.workspace.findFiles("**/code.py");
    if (files.length === 0) {
        output.appendLine("ℹ️ No code.py files found");
        return;
    }
    for (var file of files) {
        output.appendLine("▶ " + file.fsPath);
        await runStubGenerator(pythonPath, generatorPath, file.fsPath, path.join(workspaceRoot, stubDir), workspaceRoot, output);
    }
    output.appendLine("✅ Finished generating all user stubs");
}
function runStubGenerator(pythonPath, generatorPath, codePath, stubRoot, cwd, output) {
    return new Promise((resolve) => {
        var proc = (0, child_process_1.spawn)(pythonPath, [
            generatorPath,
            codePath,
            stubRoot
        ], { cwd: cwd });
        proc.stdout.on("data", (d) => {
            output.appendLine("[stdout] " + d.toString());
        });
        proc.stderr.on("data", (d) => {
            output.appendLine("[stderr] " + d.toString());
        });
        proc.on("close", (code) => {
            output.appendLine("Exit code: " + code);
            resolve();
        });
    });
}
//# sourceMappingURL=generateAllUserStubs.js.map