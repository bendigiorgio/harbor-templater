---
title: Troubleshooting
description: Common issues and fixes.
---

## Template path issues

If `--template` points to a local file, make sure the path is correct relative to your current directory.

## Existing files in the output directory

If the template tries to write to a path that already exists, use the `--conflict` and/or `--force` flags depending on what you are doing.

See the [CLI reference](../reference/cli/) for details.

## Dry runs

If you are unsure what a template will do, use `--dryRun` to preview actions without writing files.
