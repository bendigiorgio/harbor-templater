---
title: Render + Rename
description: Use copy.rename + copy.render (include/exclude) with a local directory source.
---

## What it demonstrates

- `copy.rename` token replacement in copied paths (e.g. `__PROJECT_NAME__` -> your answer)
- `copy.render` opt-in content rendering using `{{ ... }}`
- `render.exclude` to keep some files un-rendered
- Binary-safe behavior (non-UTF8 / NUL-byte files are copied as bytes)

## Template

Source file:

- `docs/examples/render-and-rename.template.json`

Key parts:

```json
{
  "type": "copy",
  "source": "./docs/examples/fixtures/rich-template",
  "target": "{{answers.projectDir}}",
  "rename": { "__PROJECT_NAME__": "{{answers.projectName}}" },
  "render": {
    "include": ["**/*"],
    "exclude": ["**/*.txt"]
  }
}
```

## Run it

```sh
harbor-templater init -t ./docs/examples/render-and-rename.template.json -o . --defaults --answer projectDir=./out --answer projectName=my-app
```
