---
title: Environment
description: Replace placeholders in a copied file using environment variables.
---

## What it demonstrates

- `environment` step replacing literal placeholders (e.g. `${DATABASE_URL}`)
- `--allowMissingEnv` flag behavior (optional)

## Template

Source file:

- `docs/examples/environment.template.json`

Key parts:

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

## Run it

Set env vars first (example):

```sh
# macOS/Linux
export DATABASE_URL="postgres://localhost:5432/db"
export API_KEY="abc"
```

```sh
harbor-templater init -t ./docs/examples/environment.template.json -o . --defaults --answer projectDir=./out
```

If you want missing env vars to be allowed:

```sh
harbor-templater init -t ./docs/examples/environment.template.json -o . --defaults --answer projectDir=./out --allowMissingEnv
```
