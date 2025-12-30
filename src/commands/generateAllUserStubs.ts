import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";

export async function generateAllUserStubs(
	context: vscode.ExtensionContext
): Promise<void> {

	var output = vscode.window.createOutputChannel("ignition-sift");
	output.show(true);

	var config = vscode.workspace.getConfiguration("ignitionSift");
	var pythonPath = config.get<string>("pythonPath", "python3");
	var stubGenerator = config.get<string>("stubGenerator", "builtin");
	var stubDir = config.get<string>("stubDir", ".stubs");

	var workspace = vscode.workspace.workspaceFolders;
	if (!workspace || workspace.length === 0) {
		output.appendLine("❌ No workspace folder found");
		return;
	}

	var workspaceRoot = workspace[0].uri.fsPath;

	var generatorPath =
		stubGenerator === "builtin"
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

		await runStubGenerator(
			pythonPath,
			generatorPath,
			file.fsPath,
			path.join(workspaceRoot, stubDir),
			workspaceRoot,
			output
		);
	}

	output.appendLine("✅ Finished generating all user stubs");
}

function runStubGenerator(
	pythonPath: string,
	generatorPath: string,
	codePath: string,
	stubRoot: string,
	cwd: string,
	output: vscode.OutputChannel
): Promise<void> {

	return new Promise((resolve) => {
		var proc = spawn(
			pythonPath,
			[
				generatorPath,
				codePath,
				stubRoot
			],
			{ cwd: cwd }
		);

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