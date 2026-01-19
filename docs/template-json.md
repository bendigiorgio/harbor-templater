# Template JSON spec (WIP)

This repo is evolving into a dynamic scaffolding CLI (Vite-style), driven by a JSON “template” file.
A template:

1. Prompts the user with questions.
2. Builds an in-memory context from answers.
3. Executes steps conditionally (`when`) to scaffold the final project:
   - download/copy remote files/folders
   - merge updates into existing files
   - substitute environment-variable placeholders
   - run commands

> This spec is intentionally “v0”: it documents the intended behavior so we can build against it.

## Top-level shape

```ts
type JSONTemplate = {
  $schema?: string; // optional JSON Schema reference for editor hints
  name: string;
  version: string;

  description?: string;
  author?: string;

  // Optional: ask the user questions before running steps
  questions?: TemplateQuestion[];

  // Ordered list of actions to scaffold the project
  steps: TemplateStep[];
};
```

## Editor IntelliSense (type hints)

You can get autocomplete + validation for template JSON files by using a JSON Schema.

This repo provides one at:

- `docs/template.schema.json`

Hosted (recommended for templates outside this repo):

- `https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json`

Options:

1. Add a `$schema` field to your template:

```json
{
  "$schema": "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  "name": "My Template",
  "version": "0.1.0",
  "steps": []
}
```

1. If you’re working in this repo in VS Code, `.vscode/settings.json` maps `**/*.template.json` to the schema automatically.

If you prefer a local schema file (offline use), you can also set:

```json
{ "$schema": "./template.schema.json" }
```

### `version`

`version` is the template schema version (not the generated app version). Recommended: semver-like strings, e.g. `"0.1.0"`.

## Context + interpolation

A template run produces a _context_ object:

- `answers.<questionId>`: raw answers from `questions`

Places we allow interpolation:

- `steps[*].target`
- `steps[*].workingDirectory`
- `steps[*].command`
- any file content replacement in `environment.variables`

Recommended interpolation format (simple and implementation-friendly): `{{answers.projectName}}`

Example:

```json
{
  "type": "command",
  "command": "pnpm install",
  "workingDirectory": "{{answers.projectDir}}"
}
```

## Questions

Questions define interactive prompts. Each question must have a stable `id`.

```ts
type TemplateQuestion = {
  id: string;
  type: "input" | "confirm" | "select" | "multiselect";
  message: string;

  default?: string | boolean | string[];
  required?: boolean;

  // For select/multiselect
  options?: Array<{ label: string; value: string }>;

  // Optional conditional display
  when?: Condition;
};
```

### Examples

```json
{
  "id": "projectName",
  "type": "input",
  "message": "Project name?",
  "required": true
}
```

```json
{
  "id": "useReact",
  "type": "confirm",
  "message": "Use React?",
  "default": true
}
```

```json
{
  "id": "packageManager",
  "type": "select",
  "message": "Package manager",
  "options": [
    { "label": "pnpm", "value": "pnpm" },
    { "label": "npm", "value": "npm" },
    { "label": "yarn", "value": "yarn" }
  ],
  "default": "pnpm"
}
```

## Conditional execution (`when`)

Both questions and steps can be conditional.

We use a small, JSON-serializable condition language (no arbitrary code execution):

```ts
type ValueRef = { ref: string }; // e.g. {ref: 'answers.useReact'}

type Condition =
  | { op: "eq" | "neq"; left: ValueRef; right: unknown }
  | { op: "in" | "notIn"; left: ValueRef; right: unknown[] }
  | { op: "truthy" | "falsy" | "exists"; value: ValueRef }
  | { op: "and" | "or"; conditions: Condition[] }
  | { op: "not"; condition: Condition };
```

Examples:

```json
{ "op": "eq", "left": { "ref": "answers.packageManager" }, "right": "pnpm" }
```

```json
{
  "op": "and",
  "conditions": [
    { "op": "truthy", "value": { "ref": "answers.useReact" } },
    { "op": "neq", "left": { "ref": "answers.packageManager" }, "right": "npm" }
  ]
}
```

If `when` is omitted, the question/step is always included.

## Steps

Steps execute in order. Each step supports an optional `when`.

```ts
type StepBase = { when?: Condition };

type CopyStep = StepBase & {
  type: "copy";
  source: string;
  target: string;
  exclude?: string[];
};

type MergeStep = StepBase & {
  type: "merge";
  source: string;
  target: string;
  merge?: {
    format?: "json" | "yaml" | "text";
    strategy?: "deep" | "shallow" | "append" | "prepend";
  };
};

type EnvironmentStep = StepBase & {
  type: "environment";
  target: string;
  variables: Record<string, string>;
};

type CommandStep = StepBase & {
  type: "command";
  command: string;
  workingDirectory?: string;
};

type TemplateStep = CopyStep | MergeStep | EnvironmentStep | CommandStep;
```

### `copy`

Downloads `source` and writes it to `target`.

- If `target` is a directory, the downloaded file/folder is placed into it.
- If `target` is a file path, the file content is written to that path.

Optional `exclude` (directory sources only):

- An array of glob patterns (matched against paths relative to the copied directory root).
- Useful to avoid copying build outputs or dependencies.

Example:

```json
{
  "type": "copy",
  "source": "github:acme/templates#main:base",
  "target": "{{answers.projectDir}}",
  "exclude": ["**/node_modules/**", "**/dist/**"]
}
```

### `merge`

Downloads `source`, then merges into `target`.

Intended use cases:

- add scripts/deps into `package.json`
- inject config fragments (e.g. ESLint rules)
- append text blocks into `README.md`

`merge.format` controls how the merger interprets the files.

Recommended initial supported behaviors:

- `json` + `deep`: deep-merge objects, concatenate arrays (or last-write-wins; choose and document once implemented)
- `text` + `append|prepend`: append/prepend the whole downloaded text to the target

### `environment`

Replaces placeholders inside a file.

- `target` is a local file path.
- `variables` is a map: `ENV_NAME -> placeholderString`.

At runtime, each `placeholderString` is replaced with the _current_ environment value of `ENV_NAME`.

Example (`.npmrc`):

```json
{
  "type": "environment",
  "target": ".npmrc",
  "variables": {
    "NPM_TOKEN": "__NPM_TOKEN__"
  }
}
```

If `NPM_TOKEN=abc`, then `__NPM_TOKEN__` becomes `abc`.

### `command`

Runs a shell command.

- `command` is executed using the platform shell.
- `workingDirectory` defaults to the template run’s output directory.

Examples:

```json
{ "type": "command", "command": "git init" }
```

```json
{
  "type": "command",
  "command": "pnpm install",
  "when": {
    "op": "eq",
    "left": { "ref": "answers.packageManager" },
    "right": "pnpm"
  }
}
```

## Remote `source` formats

`source` is a string that can represent a remote file/folder.

Planned supported formats:

- Raw URL (file): `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/<path>`
- GitHub browse URL (file or folder): `https://github.com/<owner>/<repo>/tree/<ref>/<path>` or `.../blob/...`
- Shorthand (recommended): `github:<owner>/<repo>#<ref>:<path>`

Examples:

- `github:acme/templates#main:vite/react`
- `https://raw.githubusercontent.com/acme/templates/main/vite/react/package.json`

Notes:

- Public GitHub repos are fetched via GitHub tarballs by default.
- Private GitHub repos require authentication; harbor-templater will fall back to `git` so your local credentials (credential helper / SSH agent) are used.
- You can control this behavior with:
  - `HARBOR_TEMPLATER_GITHUB_TRANSPORT=auto|tarball|git`
  - `HARBOR_TEMPLATER_GITHUB_CLONE_PROTOCOL=https|ssh`

## Example template (small but complete)

```json
{
  "name": "Vite-ish React",
  "version": "0.1.0",
  "questions": [
    {
      "id": "projectDir",
      "type": "input",
      "message": "Output directory?",
      "default": "./my-app"
    },
    {
      "id": "useReact",
      "type": "confirm",
      "message": "Use React?",
      "default": true
    },
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
  ],
  "steps": [
    {
      "type": "copy",
      "source": "github:acme/templates#main:vite/base",
      "target": "{{answers.projectDir}}"
    },
    {
      "type": "copy",
      "when": { "op": "truthy", "value": { "ref": "answers.useReact" } },
      "source": "github:acme/templates#main:vite/react",
      "target": "{{answers.projectDir}}"
    },
    {
      "type": "command",
      "command": "pnpm install",
      "workingDirectory": "{{answers.projectDir}}",
      "when": {
        "op": "eq",
        "left": { "ref": "answers.packageManager" },
        "right": "pnpm"
      }
    }
  ]
}
```

## Execution model (intended)

1. Load template JSON.
2. Prompt `questions` in order (skipping those whose `when` is false).
3. Build context `{answers: ...}`.
4. Execute `steps` in order (skipping those whose `when` is false).
5. For remote operations, download once and cache per run (nice-to-have).

## Notes / open decisions

- Merge semantics (arrays, conflict strategy) should be finalized once we implement `merge`.
- We likely want a “dry-run” mode and a “force overwrite” option in the CLI.
