---
title: クイックスタート
description: はじめてのテンプレートを実行します。
---

## 1) テンプレートを用意する

テンプレート JSON ファイルが必要です。

このリポジトリ内で試す場合は、例を使えます:

- `docs/examples/minimal.template.json`

## 2) テンプレートを実行する

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

## 3) 質問に答える

テンプレートは質問を表示できます。回答はパス、コマンド、ファイル内容の差し込みに使われます。

## 次に読む

- [CLI リファレンス](../reference/cli/)
- [Template JSON 形式](../reference/template-json/)
- [例](../examples/)
