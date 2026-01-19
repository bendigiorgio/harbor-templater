---
title: Minimal
description: 出力ディレクトリを質問して 1 ファイルをコピーする最小テンプレート。
---

## 何がわかるか

- `input` 質問を 1 つ（`projectDir`）
- `copy` ステップを 1 つ
- `{{answers.projectDir}}` の差し込み

## テンプレート

元ファイル:

- `docs/examples/minimal.template.json`

主な部分:

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

## 実行

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

プロンプトを省略したい場合:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app --defaults --answer projectDir=./my-app
```
