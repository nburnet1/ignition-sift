import * as vscode from "vscode";
import { StubIndex } from "./stubIndex";
import { registerAutoImportProvider } from "./autoImport";
import { runStubGenerator } from "./runStubGenerator";
import { initIgnitionStubs } from "./commands/initIgnitionStubs";
import { generateAllUserStubs } from "./commands/generateAllUserStubs";

export function activate(context: vscode.ExtensionContext): void {
	console.log("🔥 ignition-sift activated");

	var stubIndex = new StubIndex();
	stubIndex.rebuild(context);

	// 🔹 Generate stubs on save (code.py only)
	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((doc) => {
			if (!doc.fileName.endsWith("code.py")) {
				return;
			}

			var enabled = vscode.workspace
				.getConfiguration("ignitionSift")
				.get<boolean>("generateStubsOnSave", true);

			if (!enabled) {
				return;
			}

			runStubGenerator(context, doc, () => {
				stubIndex.rebuild(context);
			});
		})
	);

	// 🔹 Auto-import provider
	registerAutoImportProvider(context, stubIndex);

	// 🔹 Commands
	context.subscriptions.push(
		vscode.commands.registerCommand(
			"ignitionSift.initStubs",
			() => initIgnitionStubs(context)
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(
			"ignitionSift.generateAllStubs",
			() => generateAllUserStubs(context)
		)
	);
}