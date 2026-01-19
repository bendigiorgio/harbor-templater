---
title: 例
description: 実行できるテンプレート例。
---

このセクションには、`harbor-templater` の動きを理解するための小さなテンプレート例があります。

## 例の実行

リポジトリのルートから:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app
```

まず何が起きるか確認したい場合:

```sh
harbor-templater init --template ./docs/examples/minimal.template.json --out ./my-app --dryRun
```

## 一覧

- [Minimal](./minimal/)
- [Copy this repo](./copy-this-repo/)
