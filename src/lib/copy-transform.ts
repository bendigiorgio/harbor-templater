import fs from "node:fs/promises";
import path from "node:path";

import picomatch from "picomatch";

import { ensureDir } from "./fs-ops.js";
import { interpolate } from "./template-engine.js";
import type { TemplateContext } from "./template-engine.js";

export type RenderOptions = {
  include: string[];
  exclude?: string[];
};

export type CopyTransformOptions = {
  ctx: TemplateContext;
  force: boolean;
  include?: string[];
  exclude?: string[];
  rename?: Record<string, string>;
  render?: RenderOptions;
};

export async function copyDirWithTransforms(
  sourceDir: string,
  targetDir: string,
  options: CopyTransformOptions,
): Promise<void> {
  const includeMatcher = options.include?.length
    ? picomatch(options.include, { dot: true })
    : null;
  const excludeMatcher = options.exclude?.length
    ? picomatch(options.exclude, { dot: true })
    : null;

  const renderMatcher = options.render
    ? {
        include: picomatch(options.render.include, { dot: true }),
        exclude: options.render.exclude?.length
          ? picomatch(options.render.exclude, { dot: true })
          : null,
      }
    : null;

  const renamePairs = normalizeRename(options.rename, options.ctx);

  async function walk(currentSourceDir: string): Promise<void> {
    const entries = await fs.readdir(currentSourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(currentSourceDir, entry.name);
      const relNative = path.relative(sourceDir, srcPath);
      const rel = relNative.replaceAll(path.sep, "/");

      // Exclude directories early to avoid traversing large trees.
      if (entry.isDirectory() && excludeMatcher && excludeMatcher(`${rel}/x`)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(srcPath);
        continue;
      }

      if (entry.isFile()) {
        if (excludeMatcher?.(rel)) continue;
        if (includeMatcher && !includeMatcher(rel)) continue;

        const renamedRel = validateRelativePath(applyRename(rel, renamePairs));
        const dstPath = path.join(targetDir, ...renamedRel.split("/"));

        const shouldRender = Boolean(
          renderMatcher?.include(rel) && !renderMatcher.exclude?.(rel),
        );

        await copyFileMaybeRender(srcPath, dstPath, {
          ctx: options.ctx,
          force: options.force,
          render: Boolean(shouldRender),
        });
        continue;
      }

      // For now, ignore other filesystem entry types (symlinks, sockets, etc)
      throw new Error(`Unsupported entry type in template source: ${srcPath}`);
    }
  }

  await walk(sourceDir);
}

export async function copyFileMaybeRender(
  sourceFile: string,
  targetFile: string,
  options: { ctx: TemplateContext; force: boolean; render: boolean },
): Promise<void> {
  await ensureDir(path.dirname(targetFile));

  if (!options.force) {
    // Match old behavior: fail if target exists.
    await fs.access(targetFile).then(
      () => {
        throw new Error(`Target exists: ${targetFile}`);
      },
      () => undefined,
    );
  }

  if (!options.render) {
    await fs.copyFile(sourceFile, targetFile);
    return;
  }

  const buffer = Buffer.from(await fs.readFile(sourceFile));
  const text = decodeUtf8TextOrNull(buffer);

  if (text == null) {
    // Binary-safe behavior: copy bytes unchanged.
    await fs.writeFile(targetFile, buffer);
    return;
  }

  const rendered = interpolate(text, options.ctx);
  await fs.writeFile(targetFile, rendered, "utf8");
}

function decodeUtf8TextOrNull(buffer: Buffer): string | null {
  // Cheap binary heuristic: NUL bytes are extremely uncommon in text files.
  if (buffer.includes(0)) return null;

  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(buffer);
  } catch {
    return null;
  }
}

function normalizeRename(
  rename: Record<string, string> | undefined,
  ctx: TemplateContext,
): Array<[string, string]> {
  if (!rename) return [];

  const pairs: Array<[string, string]> = [];
  for (const [token, replacementRaw] of Object.entries(rename)) {
    const replacement = interpolate(replacementRaw, ctx);
    if (!token) continue;
    pairs.push([token, replacement]);
  }

  // Apply longer tokens first to reduce surprising partial overlaps.
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

function applyRename(input: string, pairs: Array<[string, string]>): string {
  let out = input;
  for (const [token, replacement] of pairs) {
    out = out.split(token).join(replacement);
  }
  return out;
}

export function applyRenameToBasename(
  basename: string,
  rename: Record<string, string> | undefined,
  ctx: TemplateContext,
): string {
  const pairs = normalizeRename(rename, ctx);
  const renamed = applyRename(basename, pairs);
  if (renamed.includes("/") || renamed.includes("\\")) {
    throw new Error(
      `Invalid rename result for basename (must not include path separators): ${renamed}`,
    );
  }
  if (renamed.includes("\u0000")) {
    throw new Error("Invalid rename result for basename (NUL byte)");
  }
  return renamed;
}

function validateRelativePath(rel: string): string {
  const cleaned = rel.replaceAll("\\", "/");
  if (cleaned.startsWith("/")) throw new Error(`Invalid relative path: ${rel}`);
  if (cleaned.includes("\u0000"))
    throw new Error("Invalid relative path (NUL byte)");
  const parts = cleaned.split("/");
  if (parts.some((p) => p === "..")) {
    throw new Error(`Invalid relative path (path traversal): ${rel}`);
  }
  return cleaned;
}
