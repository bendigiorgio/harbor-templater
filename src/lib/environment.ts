import fs from "node:fs/promises";

export async function applyEnvironmentReplacements(
  targetPath: string,
  variables: Record<string, string>,
  options: { allowMissing: boolean },
): Promise<void> {
  let contents = await fs.readFile(targetPath, "utf8");

  for (const [envName, placeholder] of Object.entries(variables)) {
    const value = process.env[envName];
    if (value == null) {
      if (options.allowMissing) continue;
      throw new Error(`Missing environment variable: ${envName}`);
    }

    contents = contents.split(placeholder).join(value);
  }

  await fs.writeFile(targetPath, contents, "utf8");
}
