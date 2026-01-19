---
title: CLI
description: harbor-templater のコマンドリファレンス。
---

## インストール

```sh
npm install -g harbor-templater
```

または `npx` で実行:

```sh
npx harbor-templater <command> [options]
```

## `harbor-templater init`

JSON テンプレートからプロジェクトを生成します。

```sh
harbor-templater init --template <path-or-url> --out <dir>
```

### よく使うフラグ

- `--template, -t` (必須): テンプレート JSON のパスまたは URL
- `--out, -o` (既定: `.`): 出力先のベースディレクトリ
- `--answer key=value` (複数回指定可): 対話せず回答を渡す
- `--defaults`: プロンプトを出さず、既定値と `--answer` を利用
- `--dryRun`: ファイルを書かず、コマンドも実行せずに内容を表示
- `--conflict error|skip|overwrite|prompt`: 出力先に既存ファイルがある場合の挙動
- `--force`: コピー時に既存ファイルを上書き
- `--allowMissingEnv`: 環境変数が見つからなくても失敗しない

### 例

このリポジトリの例テンプレートを使う:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

可能な範囲で非対話実行する:

```sh
harbor-templater init -t ./template.json -o ./my-app --defaults --answer projectDir=./my-app
```

### 補足

- `--answer` のキーは、テンプレート内の質問の `id` と一致している必要があります。
- `--defaults` を指定すると、CLI はプロンプトを出さず、質問のデフォルト値と `--answer` の値に依存します。

## ヘルプ

```sh
harbor-templater --help
harbor-templater help
harbor-templater init --help
```
