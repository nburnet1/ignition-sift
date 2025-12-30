# ignition-sift

Stub-driven auto-imports for Ignition / Jython projects.

## Features
- Runs a Python stub generator on save
- Indexes `.pyi` files
- Offers deterministic auto-imports
- No Pylance required

## Default Stub Generator
Uses a bundled Python script (requires Python 3.x).

## Override Generator
```json
{
  "ignitionSift.stubGenerator": "tools/my_stubgen.py"
}
```

## Pyright Config `pyrightconfig.json`
```json
{
  "include": ["."],
  "extraPaths": ["./.stubs"],
  "typeCheckingMode": "off",
  "reportMissingImports": true,
  "reportMissingModuleSource": false
}
```

## Ignition Flint Example Config (Workspace)
```json
		"ignitionFlint.ignitionGateways": [
			{
				"label": "localhost",
				"address": "http://localhost:80",
				"projectPaths": [
					"/var/ignition-poc/ignition/global"
				],
				"forceUpdateDesigner": true,
				"updateDesignerOnSave": true,
				"supportsProjectScanEndpoint": true,
			}
		],
```

### Install Project Scan Endpoint (8.1 dependency)
[Project Scan Endpoint](https://github.com/bw-design-group/ignition-project-scan-endpoint/releases/download/v0.0.4/Project-Scan-Endpoint.modl)
