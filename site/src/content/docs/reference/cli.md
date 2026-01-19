---
title: CLI
description: Command-line reference for harbor-templater.
---

## Install

```sh
npm install -g harbor-templater
```

or using `npx`:

```sh
npx harbor-templater <command> [options]
```

## `harbor-templater init`

Scaffold a project from a JSON template.

```sh
harbor-templater init --template <path-or-url> --out <dir>
```

### Common flags

- `--template, -t` (required): Path or URL to a template JSON file
- `--out, -o` (default: `.`): Base output directory
- `--answer key=value` (repeatable): Provide answers without prompting
- `--defaults`: Do not prompt; use defaults and provided `--answer` values
- `--dryRun`: Print actions without writing files or running commands
- `--conflict error|skip|overwrite|prompt`: What to do if a target exists
- `--force`: Overwrite existing files when copying
- `--allowMissingEnv`: Do not fail if an environment variable is missing

### Examples

Use an example template from this repo:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

Run non-interactively (where possible):

```sh
harbor-templater init -t ./template.json -o ./my-app --defaults --answer projectDir=./my-app
```

### Notes

- `--answer` keys must match question `id` values in the template.
- If you pass `--defaults`, the CLI will not prompt and will rely on question defaults plus any `--answer` values you provided.

## Help

```sh
harbor-templater --help
harbor-templater help
harbor-templater init --help
```
