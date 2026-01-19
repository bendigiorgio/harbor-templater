---
title: Quickstart
description: Run your first template.
---

## 1) Get a template

You need a template JSON file.

If you are in this repository, you can use one of the examples:

- `docs/examples/minimal.template.json`

## 2) Run the template

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

## 3) Answer prompts

Templates can ask questions. Your answers are used to fill in paths, commands, and file content.

## Next

- Read the [CLI reference](../reference/cli/)
- Learn the [Template JSON format](../reference/template-json/)
- Browse [Examples](../examples/)
