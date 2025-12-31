import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getOutputChannel } from "../output";

export async function initIgnitionStubs(
	context: vscode.ExtensionContext
): Promise<void> {

	var output = getOutputChannel();

	var config = vscode.workspace.getConfiguration("ignitionSift");
	var stubDir = config.get<string>("stubDir", ".stubs");

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

function copyDirectory(
	src: string,
	dest: string,
	output: vscode.OutputChannel
): void {

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