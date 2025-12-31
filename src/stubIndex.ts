import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

type SymbolMap = Map<string, string[]>;

export class StubIndex {
	private symbols: SymbolMap = new Map();

	public rebuild(_context: vscode.ExtensionContext): void {
		this.symbols.clear();

		var workspace = vscode.workspace.workspaceFolders;
		if (!workspace || workspace.length === 0) {
			return;
		}

		var stubDir = vscode.workspace
			.getConfiguration("ignitionSift")
			.get<string>("stubDir", ".stubs");

		var root = path.join(workspace[0].uri.fsPath, stubDir);
		if (!fs.existsSync(root)) {
			return;
		}

		this.walk(root, root);
	}

	private walk(root: string, dir: string): void {
		var entries = fs.readdirSync(dir, { withFileTypes: true });

		for (var i = 0; i < entries.length; i += 1) {
			var ent = entries[i];
			var abs = path.join(dir, ent.name);

			if (ent.isDirectory()) {
				this.walk(root, abs);
			} else if (ent.isFile() && abs.endsWith(".pyi")) {
				this.indexFile(root, abs);
			}
		}
	}

	private indexFile(root: string, file: string): void {
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

	public lookup(name: string): string[] {
		return this.symbols.get(name) || [];
	}

	public prefixLookup(
		prefix: string,
		minLength: number
	): Map<string, string[]> {

		var results = new Map<string, string[]>();

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