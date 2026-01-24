import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runCommand } from "@oclif/test";
import { expect } from "chai";

describe("init (move step)", () => {
  it("moves a file after copying", async () => {
    const tmpRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "harbor-templater-move-"),
    );
    const projectDir = path.join(tmpRoot, "out");
    const sourceDir = path.join(tmpRoot, "src");
    await fs.mkdir(sourceDir, { recursive: true });

    const fromName = "README.template.md";
    await fs.writeFile(path.join(sourceDir, fromName), "hello\n", "utf8");

    const template = {
      name: "move",
      version: "0.1.0",
      questions: [],
      steps: [
        {
          type: "copy",
          source: path.join(sourceDir, fromName),
          target: "{{answers.projectDir}}/README.template.md",
        },
        {
          type: "move",
          from: "{{answers.projectDir}}/README.template.md",
          to: "{{answers.projectDir}}/README.md",
        },
      ],
    };

    const templatePath = path.join(tmpRoot, "template.json");
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2), "utf8");

    await runCommand([
      "init",
      "--template",
      templatePath,
      "--out",
      tmpRoot,
      "--answer",
      `projectDir=${projectDir}`,
      "--defaults",
      "--conflict",
      "overwrite",
    ]);

    const finalPath = path.join(projectDir, "README.md");
    const final = await fs.readFile(finalPath, "utf8");
    expect(final.replaceAll("\r\n", "\n")).to.equal("hello\n");

    const exists = async (p: string) =>
      fs
        .access(p)
        .then(() => true)
        .catch(() => false);

    expect(await exists(path.join(projectDir, "README.template.md"))).to.equal(
      false,
    );
  });
});
