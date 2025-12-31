# ignition-sift

Barebones, stub-driven auto-imports for Ignition scripting projects.

## Motivation
After using [Ignition Flint]() for the past year, I no longer use the lack-luster script editor baked into the ignition designer.
Ignition Sift aims to improve the developer experience by automatically adding imports in the `Quick Fix` menu. This extensions remedies the need to always type out the absolute path where the developer can continue solving problems. See [Getting Started](#getting-started) for more details.

## Features
- Stub generation
	- On save
	- Bulk generation
	- Ignition `system` stubs
- Offers deterministic auto-imports via `ctrl+.`
- No LSP required

## Requirements
- Stub Generation
	- python3>=
- Pyright

## Getting Started

### Install the extension
Ignition Sift can be installed on the code registry or openvsx. 

### Configuration Defaults
```json
{
  "ignitionSift.stubGenerator": "builtin",
  "ignitionSift.stubDir": ".stubs",
  "ignitionSift.pythonPath": "python3",
  "ignitionSift.generateStubsOnSave": true,
  "ignitionSift.maxImportSuggestions": 15

}
```

### Requirement: Install Pyright
Ignition Sift relies on the flags that `pyright` raises in order to provide the `Quick Fix` menu. `pyright` is essentially a typing checker that provides very limited LSP functionality. Support for Python 2.7 (much less Jython) has been removed for `jedi` and is extremely limited for `pylance` hence why we are using `pyright`. For more information on `pyright` click [here]().

Ignition Sift should prompt you to download `pyright`.

### Pyright Config `pyrightconfig.json`
Below is the recommended config for `pyright`.

_Note: changing the stubs directory in Ignition Sift means you will need to change it in the pyright config_
```json
{
  "include": ["."],
  "extraPaths": ["./.stubs"],
  "typeCheckingMode": "off",
  "reportMissingImports": true,
  "reportMissingModuleSource": false
}
```
### Usage

#### Commands
- `ignitionSift.initStubs`
	- Adds the ignition native stubs to your `.stubs` directory
- `ignitionSift.generateAllStubs`
	- Looks through entire project to find `code.py` and then generates stubs (YMMV for project inheritance)

#### Auto Import
Ignition Sift tries its best to stay out of the way. Pyright will be doing most of the work once a module has actually been imported. To get auto import suggestions, use `ctrl+.` on an [`undefined variable`](https://github.com/microsoft/pyright/blob/main/docs/configuration.md#reportUndefinedVariable). 

#### Example

**Import System Function**

![img](https://github.com/nburnet1/ignition-sift/docs/imgs/importJson.png)

_Relative path added at top of file_

![img](https://github.com/nburnet1/ignition-sift/docs/imgs/importJsonWorks.png)

**Multiple Options**

![img](https://github.com/nburnet1/ignition-sift/docs/imgs/multipleOptions.png)
![img](https://github.com/nburnet1/ignition-sift/docs/imgs/selectedMultipleOptions.png)
_Once imported, pyright can take over in suggesting more functions and classes in the specific package._
![img](https://github.com/nburnet1/ignition-sift/docs/imgs/pyrightPromptOnceImported.png)



**User Created Function Reference**

Once a file has been saved, we can 

![img](https://github.com/nburnet1/ignition-sift/docs/imgs/userCreatedFunctionImported.png)




### Ignition Flint
As mentioned in the [motivation](#motivation), I have been using Ignition Flint for a while and it has worked beautifully and allowed us to offload the development to an external editor. You will be recommended to download Ignition Flint but it is by no means required. Just a great extension!

#### Ignition Flint Example Config (Workspace)
To ensure the same DX for all developers, you should create a `.workspace` file where you can store configurations across environments. Ignition Sift's configurations and many others can be stored here

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

#### Sidebar: Install Project Scan Endpoint (8.1 dependency)
To get the most out of Ignition **Flint**, installing the project scan endpoint will enable the gateway to show your changes in realtime.

[Project Scan Endpoint](https://github.com/bw-design-group/ignition-project-scan-endpoint/releases/download/v0.0.4/Project-Scan-Endpoint.modl)
