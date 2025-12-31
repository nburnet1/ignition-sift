"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStubGenerator = runStubGenerator;
const vscode = require("vscode");
const path = require("path");
const child_process_1 = require("child_process");
const output_1 = require("./output");
function runStubGenerator(context, document, onDone) {
    var output = (0, output_1.getOutputChannel)();
    output.appendLine("runStubGenerator called");
    output.appendLine("File: " + document.uri.fsPath);
    var config = vscode.workspace.getConfiguration("ignitionSift");
    var pythonPath = config.get("pythonPath", "python3");
    var generator = config.get("stubGenerator", "builtin");
    var stubDir = config.get("stubDir", ".stubs");
    output.appendLine("pythonPath = " + pythonPath);
    output.appendLine("stubGenerator = " + generator);
    output.appendLine("stubDir = " + stubDir);
    var workspace = vscode.workspace.workspaceFolders;
    if (!workspace || workspace.length === 0) {
        output.appendLine("❌ No workspace folders");
        return;
    }
    var workspaceRoot = workspace[0].uri.fsPath;
    var generatorPath = generator === "builtin"
        ? path.join(context.extensionPath, "python", "builtin_stubgen.py")
        : path.join(workspaceRoot, generator);
    var stubsRoot = path.join(workspaceRoot, stubDir);
    output.appendLine("Resolved generator path:");
    output.appendLine(generatorPath);
    output.appendLine("Resolved stubs root:");
    output.appendLine(stubsRoot);
    var proc = (0, child_process_1.spawn)(pythonPath, [
        generatorPath,
        document.uri.fsPath,
        stubsRoot
    ], { cwd: workspaceRoot });
    proc.stdout.on("data", (d) => {
        output.appendLine("[stdout] " + d.toString());
    });
    proc.stderr.on("data", (d) => {
        output.appendLine("[stderr] " + d.toString());
    });
    proc.on("close", (code) => {
        output.appendLine("Process exited with code " + code);
        onDone();
    });
}
//# sourceMappingURL=runStubGenerator.js.map