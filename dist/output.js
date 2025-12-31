"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputChannel = getOutputChannel;
exports.disposeOutputChannel = disposeOutputChannel;
const vscode = require("vscode");
let outputChannel;
function getOutputChannel() {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel("ignition-sift");
    }
    return outputChannel;
}
function disposeOutputChannel() {
    if (outputChannel) {
        outputChannel.dispose();
        outputChannel = undefined;
    }
}
//# sourceMappingURL=output.js.map