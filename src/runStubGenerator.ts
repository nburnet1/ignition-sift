import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";

export function runStubGenerator(
	context: vscode.ExtensionContext,
	document: vscode.TextDocument,
	onDone: () => void
): void {
	var output = vscode.window.createOutputChannel("ignition-sift");
	output.show(true);

	output.appendLine("runStubGenerator called");
	output.appendLine("File: " + document.uri.fsPath);

	var config = vscode.workspace.getConfiguration("ignitionSift");
	var pythonPath = config.get<string>("pythonPath", "python3");
	var generator = config.get<string>("stubGenerator", "builtin");
	var stubDir = config.get<string>("stubDir", ".stubs");

	output.appendLine("pythonPath = " + pythonPath);
	output.appendLine("stubGenerator = " + generator);
	output.appendLine("stubDir = " + stubDir);

	var workspace = vscode.workspace.workspaceFolders;
	if (!workspace || workspace.length === 0) {
		output.appendLine("❌ No workspace folders");
		return;
	}

	var workspaceRoot = workspace[0].uri.fsPath;

	var generatorPath =
		generator === "builtin"
			? path.join(context.extensionPath, "python", "builtin_stubgen.py")
			: path.join(workspaceRoot, generator);

	var stubsRoot = path.join(workspaceRoot, stubDir);

	output.appendLine("Resolved generator path:");
	output.appendLine(generatorPath);

	output.appendLine("Resolved stubs root:");
	output.appendLine(stubsRoot);

	var proc = spawn(
		pythonPath,
		[
			generatorPath,
			document.uri.fsPath,
			stubsRoot
		],
		{ cwd: workspaceRoot }
	);

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