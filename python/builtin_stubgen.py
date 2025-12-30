#!/usr/bin/env python3
"""
regenerate_stubs.py —— generate <name>.pyi where <name> is the last dir before code.py

Supports type comments like:
    def func(x, y):
        # type: (int, str) -> bool

Handles:
- instance methods (skip self)
- class methods (skip cls)
- class-level constants with literal values
"""

import ast
import sys
from pathlib import Path


def is_classmethod(node):  # type: (ast.FunctionDef) -> bool
	return any(
		isinstance(d, ast.Name) and d.id == "classmethod"
		or isinstance(d, ast.Attribute) and d.attr == "classmethod"
		for d in node.decorator_list
	)


def stub_from_node(node, indent=""):
	lines = []

	if isinstance(node, ast.FunctionDef):
		arg_names = [arg.arg for arg in node.args.args]
		is_method = len(arg_names) > 0 and arg_names[0] == "self"
		is_cls_method = (
			len(arg_names) > 0
			and arg_names[0] == "cls"
			and is_classmethod(node)
		)
		skip_first = is_method or is_cls_method
		params = ", ".join(arg_names)

		if node.type_comment:
			type_sig = node.type_comment.strip()
			if type_sig.startswith("(") and ") -> " in type_sig:
				try:
					arg_part, ret_type = type_sig.split(") -> ")
					arg_types = [typ.strip() for typ in arg_part.strip("()").split(",")]
					if skip_first:
						typed_args = [arg_names[0]] + [
							"{}: {}".format(name, typ)
							for name, typ in zip(arg_names[1:], arg_types)
						]
					else:
						typed_args = [
							"{}: {}".format(name, typ)
							for name, typ in zip(arg_names, arg_types)
						]

					lines.append(
						"{}def {}({}) -> {}:".format(
							indent,
							node.name,
							", ".join(typed_args),
							ret_type.strip(),
						)
					)
				except Exception:
					lines.append("{}def {}({}) -> Any:".format(indent, node.name, params))
			else:
				lines.append("{}def {}({}) -> Any:".format(indent, node.name, params))
		else:
			lines.append("{}def {}({}) -> Any:".format(indent, node.name, params))

		doc = ast.get_docstring(node)
		if not doc and node.body:
			first_stmt = node.body[0]
			if isinstance(first_stmt, ast.Expr) and isinstance(
				first_stmt.value, (ast.Str, ast.Constant)
			):
				doc = getattr(first_stmt.value, "s", None) or getattr(
					first_stmt.value, "value", None
				)

		if doc:
			doc = doc.replace('"""', '\\"\\"\\"')
			lines.append('{}    """{}"""'.format(indent, doc))

		lines.append("{}    ...".format(indent))

	elif isinstance(node, ast.ClassDef):
		base_names = []
		for base in node.bases:
			if isinstance(base, ast.Name):
				base_names.append(base.id)
			elif isinstance(base, ast.Attribute):
				parts = []
				while isinstance(base, ast.Attribute):
					parts.insert(0, base.attr)
					base = base.value
				if isinstance(base, ast.Name):
					parts.insert(0, base.id)
				base_names.append(".".join(parts))
			else:
				base_names.append("Any")

		base_clause = "({})".format(", ".join(base_names)) if base_names else ""
		lines.append("{}class {}{}:".format(indent, node.name, base_clause))

		doc = ast.get_docstring(node)
		if doc:
			doc = doc.replace('"""', '\\"\\"\\"')
			lines.append('{}    """{}"""'.format(indent, doc))

		body_lines = []
		for inner in node.body:
			if isinstance(inner, ast.Assign):
				for target in inner.targets:
					if isinstance(target, ast.Name):
						name = target.id
						value = inner.value
						if isinstance(value, ast.Constant):
							body_lines.append(
								"{}    {}: Any = {}".format(indent, name, repr(value.value))
							)
						elif isinstance(value, ast.Str):
							body_lines.append(
								"{}    {}: Any = {}".format(indent, name, repr(value.s))
							)
						elif isinstance(value, ast.Num):
							body_lines.append(
								"{}    {}: Any = {}".format(indent, name, value.n)
							)
						elif isinstance(value, ast.NameConstant):
							body_lines.append(
								"{}    {}: Any = {}".format(indent, name, value.value)
							)
						elif isinstance(value, ast.Name):
							body_lines.append(
								"{}    {}: {} = {}".format(indent, name, value.id, value.id)
							)
						else:
							body_lines.append("{}    {}: Any".format(indent, name))
			else:
				body_lines.extend(stub_from_node(inner, indent + "    "))

		lines.extend(body_lines or ["{}    pass".format(indent)])

	return lines


def find_source_root(path):  # type: (Path) -> Path
	for parent in path.parents:
		if (parent / "script-python").exists():
			return (parent / "script-python").resolve()
	raise ValueError("❌ Could not determine SOURCE_ROOT from: {}".format(path))


def generate_stub(src_path, stubs_root):  # type: (Path, Path) -> None
	if not src_path.is_file() or src_path.name != "code.py":
		print("🚫 Not a valid code.py file: {}".format(src_path))
		return

	try:
		source_root = find_source_root(src_path)
		rel_path = src_path.resolve().relative_to(source_root)
	except ValueError as e:
		print(e)
		return

	if len(rel_path.parts) < 2:
		print("🚫 Not enough depth to determine stub name: {}".format(rel_path))
		return

	*stub_dir_parts, stub_name, _ = rel_path.parts
	stub_dir = stubs_root.joinpath(*stub_dir_parts)
	stub_file = stub_dir / "{}.pyi".format(stub_name)
	stub_dir.mkdir(parents=True, exist_ok=True)

	with src_path.open("r") as f:
		source_lines = f.readlines()
		try:
			tree = ast.parse(
				"".join(source_lines),
				filename=str(src_path),
				type_comments=True,
			)
		except SyntaxError as e:
			print("⚠️ Syntax error in {}: {}".format(src_path, e))
			return

	import_lines = [
		line.rstrip("\n")
		for line in source_lines
		if line.startswith("import ") or line.startswith("from ")
	]

	stub_lines = import_lines + ["from typing import Any", ""]
	for node in tree.body:
		stub_lines.extend(stub_from_node(node))

	stub_file.write_text("\n".join(stub_lines) + "\n")
	print("✅ Stub written to: {}".format(stub_file))


def main():
	if len(sys.argv) != 3:
		print("Usage: python regenerate_stubs.py <path/to/code.py> <stubs_root>")
		return

	src = Path(sys.argv[1]).resolve()
	stubs_root = Path(sys.argv[2]).resolve()

	generate_stub(src, stubs_root)


if __name__ == "__main__":
	main()
