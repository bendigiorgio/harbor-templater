---
title: Examples
description: Runnable example templates.
---

This section contains small templates you can run to understand how `harbor-templater` works.

## Running an example

From the repository root:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

If you want to preview what will happen first:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app --dryRun
```

## Examples

- [Minimal](./minimal/)
- [Copy this repo](./copy-this-repo/)
