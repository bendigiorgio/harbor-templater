import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath: string): Promise<boolean> {
  return await fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
}

export async function copyPath(
  sourcePath: string,
  targetPath: string,
  options: { force: boolean },
): Promise<void> {
  const stat = await fs.stat(sourcePath);

  if (stat.isDirectory()) {
    await ensureDir(targetPath);
    // Node 18+ supports fs.cp
    await fs.cp(sourcePath, targetPath, {
      recursive: true,
      force: options.force,
    });
    return;
  }

  await ensureDir(path.dirname(targetPath));
  if (!options.force) {
    if (await pathExists(targetPath))
      throw new Error(`Target exists: ${targetPath}`);
  }

  await fs.copyFile(sourcePath, targetPath);
}

export function looksLikeDirTarget(target: string): boolean {
  return target.endsWith("/") || target.endsWith("\\");
}
