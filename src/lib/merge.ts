import fs from "node:fs/promises";
import path from "node:path";

import { ensureDir } from "./fs-ops.js";

export type MergeOptions = {
  format?: "json" | "yaml" | "text";
  strategy?: "deep" | "shallow" | "append" | "prepend";
};

export async function mergeIntoTarget(
  sourcePath: string,
  targetPath: string,
  options: MergeOptions,
): Promise<void> {
  const format = options.format ?? "json";
  const strategy = options.strategy ?? "deep";

  if (format === "yaml") {
    throw new Error("YAML merge is not implemented yet");
  }

  await ensureDir(path.dirname(targetPath));

  if (format === "text") {
    const incoming = await fs.readFile(sourcePath, "utf8");
    let existing = "";
    try {
      existing = await fs.readFile(targetPath, "utf8");
    } catch {
      // doesn't exist
    }

    const merged =
      strategy === "prepend"
        ? `${incoming}${existing}`
        : strategy === "append"
          ? `${existing}${incoming}`
          : incoming;

    await fs.writeFile(targetPath, merged, "utf8");
    return;
  }

  // json
  const incoming: unknown = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  let existing: unknown = {};
  try {
    existing = JSON.parse(await fs.readFile(targetPath, "utf8")) as unknown;
  } catch {
    existing = {};
  }

  const merged =
    strategy === "shallow"
      ? shallowMerge(existing, incoming)
      : deepMerge(existing, incoming);

  await fs.writeFile(
    targetPath,
    `${JSON.stringify(merged, null, 2)}\n`,
    "utf8",
  );
}

function shallowMerge(a: unknown, b: unknown): unknown {
  if (!isPlainObject(a) || !isPlainObject(b)) return b;
  return { ...a, ...b };
}

function deepMerge(a: unknown, b: unknown): unknown {
  if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
  if (!isPlainObject(a) || !isPlainObject(b)) return b;

  const out: Record<string, unknown> = { ...a };
  for (const [key, value] of Object.entries(b)) {
    if (Object.hasOwn(out, key)) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }

  return out;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}
