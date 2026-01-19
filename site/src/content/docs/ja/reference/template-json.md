---
title: Template JSON
description: Harbor のテンプレート JSON 形式リファレンス。
---

このページでは `harbor-templater` が読み込むテンプレートファイル形式を説明します。

## スキーマと検証

- このプロジェクトは、エディタの IntelliSense と検証のための JSON Schema を提供します。
- スキーマ URL:
  `https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json`

テンプレートファイルの先頭に `$schema` を追加すると、対応エディタで補完が効きます:

```json
{
  "$schema": "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  "name": "My Template",
  "version": "0.1.0",
  "steps": []
}
```

## トップレベルのフィールド

テンプレートは次のような JSON オブジェクトです:

```json
{
  "$schema": "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  "name": "My Template",
  "version": "0.1.0",
  "description": "Optional",
  "author": "Optional",
  "questions": [],
  "steps": []
}
```

- `name` (必須): 表示名
- `version` (必須): テンプレートのバージョン（生成物のアプリ版とは別）
- `questions` (任意): ユーザーに表示する質問
- `steps` (必須): CLI が順番に実行する処理

## 差し込み（Interpolation）

`{{ ... }}` で回答などを参照できます。

例:

```json
{
  "type": "command",
  "command": "pnpm install",
  "workingDirectory": "{{answers.projectDir}}"
}
```

## 質問（Questions）

質問は対話プロンプトを定義し、`answers` コンテキストを生成します。

```json
{
  "id": "projectName",
  "type": "input",
  "message": "Project name?",
  "required": true
}
```

サポートしている質問タイプ:

- `input`
- `confirm`
- `select`
- `multiselect`

`select` / `multiselect` では `options` を使います:

```json
{
  "id": "packageManager",
  "type": "select",
  "message": "Package manager",
  "options": [
    { "label": "pnpm", "value": "pnpm" },
    { "label": "npm", "value": "npm" }
  ],
  "default": "pnpm"
}
```

## 条件（`when`）

質問やステップは `when` で条件付きにできます。

```json
{
  "op": "eq",
  "left": { "ref": "answers.packageManager" },
  "right": "pnpm"
}
```

よく使う演算子:

- `eq`, `neq`
- `in`, `notIn`
- `truthy`, `falsy`, `exists`
- `and`, `or`, `not`

## ステップ（Steps）

ステップは順番に実行されます。各ステップには `type` があり、任意で `when` を指定できます。

### `copy`

`source` から `target` にファイル/ディレクトリをコピーします。

```json
{
  "type": "copy",
  "source": "github:some-org/some-repo#main:template",
  "target": "{{answers.projectDir}}",
  "exclude": ["**/node_modules/**", "**/dist/**"]
}
```

### `merge`

`source` を取得して `target` にマージします。

```json
{
  "type": "merge",
  "source": "./snippets/package.json",
  "target": "{{answers.projectDir}}/package.json",
  "merge": { "format": "json", "strategy": "deep" }
}
```

### `environment`

ターゲットファイル内の環境変数プレースホルダを置換します。

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

### `command`

シェルコマンドを実行します。

```json
{
  "type": "command",
  "command": "pnpm install",
  "workingDirectory": "{{answers.projectDir}}"
}
```

## 例

実行できるテンプレート例と解説は [例](../examples/) を参照してください。

リポジトリ内のサンプル:

- `docs/examples/`

## メモ

- 新しいテンプレートを試すときは `--dryRun` を使うと安全です。
- 質問の `id` は回答のキーになるので、安定した値にしてください。

形式の詳細（作業中）については、リポジトリ内の次のファイルも参照できます:

- `docs/template-json.md`
