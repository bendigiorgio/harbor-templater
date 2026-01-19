---
title: Copy this repo
description: GitHub リポジトリをコピーし、必要なら test/ を含めるテンプレート。
---

## 何がわかるか

- `github:` 形式の source でリポジトリ配下をコピー
- よくある除外パス（`node_modules`, `dist`, `.git` など）
- `when` による条件付きステップ

## テンプレート

元ファイル:

- `docs/examples/copy-this-repo.template.json`

主な部分:

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

## 実行

```sh
harbor-templater init --template ./docs/examples/copy-this-repo.template.json --out ./repo-copy
```

非対話で実行する場合:

```sh
harbor-templater init --template ./docs/examples/copy-this-repo.template.json --out ./repo-copy --defaults --answer projectDir=./repo-copy --answer includeTests=true
```
