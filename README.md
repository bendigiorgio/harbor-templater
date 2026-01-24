# harbor-templater

A new CLI generated with oclif

## Dynamic Templates (WIP)

This CLI is being extended into a dynamic project scaffolder (Vite-style) driven by a JSON template.

- Template JSON spec: ./docs/template-json.md
- Examples: ./docs/examples/

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/harbor-templater.svg)](https://npmjs.org/package/harbor-templater)
[![Downloads/week](https://img.shields.io/npm/dw/harbor-templater.svg)](https://npmjs.org/package/harbor-templater)

<!-- toc -->
* [harbor-templater](#harbor-templater)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g harbor-templater
$ harbor-templater COMMAND
running command...
$ harbor-templater (--version)
harbor-templater/1.3.0 linux-x64 node-v24.12.0
$ harbor-templater --help [COMMAND]
USAGE
  $ harbor-templater COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`harbor-templater help [COMMAND]`](#harbor-templater-help-command)
* [`harbor-templater init`](#harbor-templater-init)
* [`harbor-templater plugins`](#harbor-templater-plugins)
* [`harbor-templater plugins add PLUGIN`](#harbor-templater-plugins-add-plugin)
* [`harbor-templater plugins:inspect PLUGIN...`](#harbor-templater-pluginsinspect-plugin)
* [`harbor-templater plugins install PLUGIN`](#harbor-templater-plugins-install-plugin)
* [`harbor-templater plugins link PATH`](#harbor-templater-plugins-link-path)
* [`harbor-templater plugins remove [PLUGIN]`](#harbor-templater-plugins-remove-plugin)
* [`harbor-templater plugins reset`](#harbor-templater-plugins-reset)
* [`harbor-templater plugins uninstall [PLUGIN]`](#harbor-templater-plugins-uninstall-plugin)
* [`harbor-templater plugins unlink [PLUGIN]`](#harbor-templater-plugins-unlink-plugin)
* [`harbor-templater plugins update`](#harbor-templater-plugins-update)

## `harbor-templater help [COMMAND]`

Display help for harbor-templater.

```
USAGE
  $ harbor-templater help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for harbor-templater.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `harbor-templater init`

Scaffold a project from a JSON template

```
USAGE
  $ harbor-templater init -t <value> [-o <value>] [--answer <value>...] [--defaults] [--dryRun]
    [--conflict error|skip|overwrite|prompt] [--force] [--allowMissingEnv]

FLAGS
  -o, --out=<value>        [default: .] Base output directory (relative targets resolve from here)
  -t, --template=<value>   (required) Path or URL to a template JSON file
      --allowMissingEnv    Do not fail if an environment variable is missing for an environment step
      --answer=<value>...  Provide an answer: --answer key=value (repeatable)
      --conflict=<option>  [default: prompt] When a target already exists: error|skip|overwrite|prompt
                           <options: error|skip|overwrite|prompt>
      --defaults           Do not prompt; use defaults and provided --answer values
      --dryRun             Print actions without writing files or running commands
      --force              Overwrite existing files when copying

DESCRIPTION
  Scaffold a project from a JSON template

EXAMPLES
  $ harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app

  $ harbor-templater init -t template.json -o . --answer projectDir=./my-app --defaults
```

_See code: [src/commands/init/index.ts](https://github.com/bendigiorgio/harbor-templater/blob/v1.3.0/src/commands/init/index.ts)_

## `harbor-templater plugins`

List installed plugins.

```
USAGE
  $ harbor-templater plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ harbor-templater plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/index.ts)_

## `harbor-templater plugins add PLUGIN`

Installs a plugin into harbor-templater.

```
USAGE
  $ harbor-templater plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into harbor-templater.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HARBOR_TEMPLATER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HARBOR_TEMPLATER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ harbor-templater plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ harbor-templater plugins add myplugin

  Install a plugin from a github url.

    $ harbor-templater plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ harbor-templater plugins add someuser/someplugin
```

## `harbor-templater plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ harbor-templater plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ harbor-templater plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/inspect.ts)_

## `harbor-templater plugins install PLUGIN`

Installs a plugin into harbor-templater.

```
USAGE
  $ harbor-templater plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into harbor-templater.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the HARBOR_TEMPLATER_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the HARBOR_TEMPLATER_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ harbor-templater plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ harbor-templater plugins install myplugin

  Install a plugin from a github url.

    $ harbor-templater plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ harbor-templater plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/install.ts)_

## `harbor-templater plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ harbor-templater plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ harbor-templater plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/link.ts)_

## `harbor-templater plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ harbor-templater plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ harbor-templater plugins unlink
  $ harbor-templater plugins remove

EXAMPLES
  $ harbor-templater plugins remove myplugin
```

## `harbor-templater plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ harbor-templater plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/reset.ts)_

## `harbor-templater plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ harbor-templater plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ harbor-templater plugins unlink
  $ harbor-templater plugins remove

EXAMPLES
  $ harbor-templater plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/uninstall.ts)_

## `harbor-templater plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ harbor-templater plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  [PLUGIN...]  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ harbor-templater plugins unlink
  $ harbor-templater plugins remove

EXAMPLES
  $ harbor-templater plugins unlink myplugin
```

## `harbor-templater plugins update`

Update installed plugins.

```
USAGE
  $ harbor-templater plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.54/src/commands/plugins/update.ts)_
<!-- commandsstop -->
