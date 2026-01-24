---
title: Move
description: Copy a file, then move/rename it with the move step.
---

## What it demonstrates

- `move` step (renaming a file)
- Interpolation in `from` / `to`

## Template

Source file:

- `docs/examples/move.template.json`

Key parts:

```json
{
  "steps": [
    {
      "type": "copy",
      "source": "./docs/examples/fixtures/move/README.template.md",
      "target": "{{answers.projectDir}}/README.template.md"
    },
    {
      "type": "move",
      "from": "{{answers.projectDir}}/README.template.md",
      "to": "{{answers.projectDir}}/README.md"
    }
  ]
}
```

## Run it

```sh
harbor-templater init -t ./docs/examples/move.template.json -o . --defaults --answer projectDir=./out
```
