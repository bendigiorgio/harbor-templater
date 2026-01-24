---
title: Template JSON
description: Reference for the Harbor template JSON format.
---

This page documents the template file format consumed by `harbor-templater`.

## Schema and validation

- The project provides a JSON Schema for editor IntelliSense and validation.
- Hosted schema URL:
  `https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json`

Add this to your template file for editor IntelliSense:

```json
{
  "$schema": "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  "name": "My Template",
  "version": "0.1.0",
  "steps": []
}
```

## Top-level fields

A template is a JSON object with these common fields:

```json
{
  "$schema": "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  "name": "My Template",
  "version": "0.1.0",
  "description": "Optional",
  "author": "Optional",
  "questions": [],
  "steps": []
}
```

- `name` (required): display name.
- `version` (required): template version (not the generated app version).
- `questions` (optional): prompts shown to the user.
- `steps` (required): ordered actions executed by the CLI.

## Interpolation

Templates can reference answers using `{{ ... }}` placeholders.

Example:

```json
{
  "type": "command",
  "command": "pnpm install",
  "workingDirectory": "{{answers.projectDir}}"
}
```

## Questions

Questions define interactive prompts and produce an `answers` context.

```json
{
  "id": "projectName",
  "type": "input",
  "message": "Project name?",
  "required": true
}
```

Supported question types:

- `input`
- `confirm`
- `select`
- `multiselect`

Select-like questions use `options`:

```json
{
  "id": "packageManager",
  "type": "select",
  "message": "Package manager",
  "options": [
    { "label": "pnpm", "value": "pnpm" },
    { "label": "npm", "value": "npm" }
  ],
  "default": "pnpm"
}
```

## Conditions (`when`)

Questions and steps can be conditional via a JSON condition object.

```json
{
  "op": "eq",
  "left": { "ref": "answers.packageManager" },
  "right": "pnpm"
}
```

Common operators:

- `eq`, `neq`
- `in`, `notIn`
- `truthy`, `falsy`, `exists`
- `and`, `or`, `not`

## Steps

Steps run in order. Each step has a `type` and supports an optional `when`.

### `copy`

Copies a file or directory from `source` to `target`.

```json
{
  "type": "copy",
  "source": "github:some-org/some-repo#main:template",
  "target": "{{answers.projectDir}}",
  "include": ["**/*.md", "**/*.ts"],
  "exclude": ["**/node_modules/**", "**/dist/**"]
}
```

Additional options:

- `include` (optional, directory sources only): allowlist glob patterns.
- `exclude` (optional, directory sources only): denylist glob patterns.
- `rename` (optional): token replacement map applied to copied relative paths.
- `render` (optional): opt-in content templating for matching files (UTF-8 text only; binary-safe).

Example (rename + render):

```json
{
  "type": "copy",
  "source": "github:some-org/some-repo#main:template",
  "target": "{{answers.projectDir}}",
  "rename": { "__PROJECT_NAME__": "{{answers.projectName}}" },
  "render": { "include": ["**/*.md", "**/*.ts"] }
}
```

### `merge`

Downloads `source` and merges it into `target`.

```json
{
  "type": "merge",
  "source": "./snippets/package.json",
  "target": "{{answers.projectDir}}/package.json",
  "merge": { "format": "json", "strategy": "deep" }
}
```

### `environment`

Replaces environment variable placeholders in a target file.

```json
{
  "type": "environment",
  "target": "{{answers.projectDir}}/.env",
  "variables": {
    "DATABASE_URL": "${DATABASE_URL}",
    "API_KEY": "${API_KEY}"
  }
}
```

### `command`

Runs a shell command.

```json
{
  "type": "command",
  "command": "pnpm install",
  "workingDirectory": "{{answers.projectDir}}"
}
```

### `move`

Moves/renames a local file or directory.

```json
{
  "type": "move",
  "from": "{{answers.projectDir}}/README.template.md",
  "to": "{{answers.projectDir}}/README.md"
}
```

## Examples

See the site’s [Examples](../examples/) section for runnable templates and explanations.

Or check out the examples in the repository:

[`docs/examples/`](https://github.com/bendigiorgio/harbor-templater/tree/develop/docs/examples)

## Notes

- Use `--dryRun` when testing a new template.
- Prefer stable `id` values for questions because answers are keyed by `id`.

For the full (work-in-progress) spec, see the source file in the repository:

- `docs/template-json.md`
