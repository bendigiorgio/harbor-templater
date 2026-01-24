---
title: Include + Exclude
description: Use copy.include and copy.exclude globs when copying a directory.
---

## What it demonstrates

- `copy.include` allowlist globs (directory sources only)
- `copy.exclude` denylist globs (applied after `include`)

## Template

Source file:

- `docs/examples/include-exclude.template.json`

Key parts:

```json
{
  "type": "copy",
  "source": "./docs/examples/fixtures/include-exclude",
  "target": "{{answers.projectDir}}",
  "include": ["README.md", "src/**"],
  "exclude": ["**/*.test.ts", "dist/**"]
}
```

## Run it

```sh
harbor-templater init -t ./docs/examples/include-exclude.template.json -o . --defaults --answer projectDir=./out
```
