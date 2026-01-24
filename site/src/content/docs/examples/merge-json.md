---
title: Merge JSON
description: Merge JSON into an existing file using the merge step.
---

## What it demonstrates

- `merge` step with `format: "json"`
- `strategy: "deep"` (object keys merge; arrays concatenate)

## Template

Source file:

- `docs/examples/merge-json.template.json`

Key parts:

```json
{
  "type": "merge",
  "source": "./docs/examples/fixtures/merge/addon.package.json",
  "target": "{{answers.projectDir}}/package.json",
  "merge": { "format": "json", "strategy": "deep" }
}
```

## Run it

```sh
harbor-templater init -t ./docs/examples/merge-json.template.json -o . --defaults --answer projectDir=./out
```
