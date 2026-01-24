import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { runCommand } from "@oclif/test";
import { expect } from "chai";

describe("init (copy render + rename)", () => {
  it("renders selected text files, renames paths, and preserves binary files", async () => {
    const tmpRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "harbor-templater-render-"),
    );
    const projectDir = path.join(tmpRoot, "out");
    const sourceDir = path.join(tmpRoot, "src");

    await fs.mkdir(path.join(sourceDir, "__PROJECT_NAME__", "src"), {
      recursive: true,
    });

    await fs.writeFile(
      path.join(sourceDir, "__PROJECT_NAME__", "README.md"),
      "# {{answers.projectName}}\n",
      "utf8",
    );

    await fs.writeFile(
      path.join(sourceDir, "__PROJECT_NAME__", "src", "index.ts"),
      'export const project = "{{answers.projectName}}";\n',
      "utf8",
    );

    // Not included in render globs; placeholder should remain.
    await fs.writeFile(
      path.join(sourceDir, "__PROJECT_NAME__", "notes.txt"),
      "notes {{answers.projectName}}\n",
      "utf8",
    );

    const binary = Buffer.from([0, 1, 2, 3, 255]);
    await fs.writeFile(
      path.join(sourceDir, "__PROJECT_NAME__", "bin.dat"),
      binary,
    );

    const template = {
      name: "render + rename",
      version: "0.1.0",
      questions: [],
      steps: [
        {
          type: "copy",
          source: sourceDir,
          target: "{{answers.projectDir}}",
          rename: { __PROJECT_NAME__: "{{answers.projectName}}" },
          render: { include: ["**/*.md", "**/*.ts"] },
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
      "--answer",
      "projectName=demo",
      "--defaults",
      "--conflict",
      "overwrite",
    ]);

    const readme = await fs.readFile(
      path.join(projectDir, "demo", "README.md"),
      "utf8",
    );
    expect(readme.replaceAll("\r\n", "\n")).to.equal("# demo\n");

    const indexTs = await fs.readFile(
      path.join(projectDir, "demo", "src", "index.ts"),
      "utf8",
    );
    expect(indexTs).to.contain('project = "demo"');

    const notes = await fs.readFile(
      path.join(projectDir, "demo", "notes.txt"),
      "utf8",
    );
    expect(notes).to.contain("{{answers.projectName}}");

    const outBinary = await fs.readFile(
      path.join(projectDir, "demo", "bin.dat"),
    );
    expect(outBinary.equals(binary)).to.equal(true);
  });
});
