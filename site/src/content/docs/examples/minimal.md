---
title: Minimal
description: A minimal template that asks for an output directory and copies one file.
---

## What it demonstrates

- A single `input` question (`projectDir`)
- A single `copy` step
- Interpolation using `{{answers.projectDir}}`

## Template

Source file:

- `docs/examples/minimal.template.json`

Key parts:

```json
{
  "questions": [
    {
      "id": "projectDir",
      "type": "input",
      "message": "Output directory?",
      "default": "./my-app"
    }
  ],
  "steps": [
    {
      "type": "copy",
      "source": "https://raw.githubusercontent.com/OWNER/REPO/REF/path/to/file.txt",
      "target": "{{answers.projectDir}}/file.txt"
    }
  ]
}
```

## Run it

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

If you want to skip prompts:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app --defaults --answer projectDir=./my-app
```
