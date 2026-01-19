---
title: Copy this repo
description: Copies a GitHub repository and conditionally includes the test folder.
---

## What it demonstrates

- Copying a whole repository directory using the `github:` source format
- Excluding common unwanted paths (`node_modules`, `dist`, `.git`, etc.)
- Conditional steps using `when`

## Template

Source file:

- `docs/examples/copy-this-repo.template.json`

Key parts:

```json
{
  "questions": [
    {
      "id": "includeTests",
      "type": "confirm",
      "message": "Include the test/ folder?",
      "default": false
    }
  ],
  "steps": [
    {
      "type": "copy",
      "source": "github:bendigiorgio/harbor-templater#main:.",
      "target": "{{answers.projectDir}}",
      "exclude": ["**/node_modules/**", "**/dist/**", "**/.git/**"]
    },
    {
      "type": "copy",
      "source": "github:bendigiorgio/harbor-templater#main:test",
      "target": "{{answers.projectDir}}/test",
      "when": { "op": "truthy", "value": { "ref": "answers.includeTests" } }
    }
  ]
}
```

## Run it

```sh
harbor-templater init --template ./docs/examples/copy-this-repo.template.json --out ./repo-copy
```

To run non-interactively:

```sh
harbor-templater init --template ./docs/examples/copy-this-repo.template.json --out ./repo-copy --defaults --answer projectDir=./repo-copy --answer includeTests=true
```
