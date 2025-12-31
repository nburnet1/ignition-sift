"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = require("vscode");
const stubIndex_1 = require("./stubIndex");
const autoImport_1 = require("./autoImport");
const runStubGenerator_1 = require("./runStubGenerator");
const initIgnitionStubs_1 = require("./commands/initIgnitionStubs");
const generateAllUserStubs_1 = require("./commands/generateAllUserStubs");
function activate(context) {
    console.log("🔥 ignition-sift activated");
    var stubIndex = new stubIndex_1.StubIndex();
    stubIndex.rebuild(context);
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!doc.fileName.endsWith("code.py")) {
            return;
        }
        var enabled = vscode.workspace
            .getConfiguration("ignitionSift")
            .get("generateStubsOnSave", true);
        if (!enabled) {
            return;
        }
        (0, runStubGenerator_1.runStubGenerator)(context, doc, () => {
            stubIndex.rebuild(context);
        });
    }));
    (0, autoImport_1.registerAutoImportProvider)(context, stubIndex);
    context.subscriptions.push(vscode.commands.registerCommand("ignitionSift.initStubs", () => (0, initIgnitionStubs_1.initIgnitionStubs)(context)));
    context.subscriptions.push(vscode.commands.registerCommand("ignitionSift.generateAllStubs", () => (0, generateAllUserStubs_1.generateAllUserStubs)(context)));
}
//# sourceMappingURL=extension.js.map