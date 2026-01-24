import fs from "node:fs/promises";
import path from "node:path";
import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { Command, Flags } from "@oclif/core";
import picomatch from "picomatch";
import { runShellCommand } from "../../lib/commands.js";
import {
  applyRenameToBasename,
  copyDirWithTransforms,
  copyFileMaybeRender,
} from "../../lib/copy-transform.js";
import { applyEnvironmentReplacements } from "../../lib/environment.js";
import { ensureDir, looksLikeDirTarget, pathExists } from "../../lib/fs-ops.js";
import { mergeIntoTarget } from "../../lib/merge.js";
import { resolveSource } from "../../lib/sources.js";
import {
  buildInitialContext,
  evaluateCondition,
  interpolate,
  resolveTargetPath,
  templateQuestions,
  templateSteps,
} from "../../lib/template-engine.js";
import type {
  JSONTemplate,
  TemplateQuestion,
  TemplateStep,
} from "../../lib/template-json.js";

export default class Init extends Command {
  static description = "Scaffold a project from a JSON template";

  static examples = [
    `<%= config.bin %> <%= command.id %> --template ./docs/examples/minimal.template.json --out ./my-app`,
    `<%= config.bin %> <%= command.id %> -t template.json -o . --answer projectDir=./my-app --defaults`,
  ];

  static flags = {
    template: Flags.string({
      char: "t",
      description: "Path or URL to a template JSON file",
      required: true,
    }),
    out: Flags.string({
      char: "o",
      description: "Base output directory (relative targets resolve from here)",
      default: ".",
    }),
    answer: Flags.string({
      description: "Provide an answer: --answer key=value (repeatable)",
      multiple: true,
    }),
    defaults: Flags.boolean({
      description: "Do not prompt; use defaults and provided --answer values",
      default: false,
    }),
    dryRun: Flags.boolean({
      description: "Print actions without writing files or running commands",
      default: false,
    }),
    conflict: Flags.string({
      description: "When a target already exists: error|skip|overwrite|prompt",
      options: ["error", "skip", "overwrite", "prompt"],
      default: "prompt",
    }),
    force: Flags.boolean({
      description: "Overwrite existing files when copying",
      default: false,
    }),
    allowMissingEnv: Flags.boolean({
      description:
        "Do not fail if an environment variable is missing for an environment step",
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Init);

    const outDir = path.resolve(flags.out);
    await ensureDir(outDir);

    const initialAnswers = parseAnswers(flags.answer ?? []);
    const template = await loadTemplate(flags.template);

    const ctx = buildInitialContext(outDir, initialAnswers);

    await collectAnswers({
      questions: templateQuestions(template),
      ctx,
      defaults: flags.defaults,
    });

    const steps = templateSteps(template);
    await executeSteps({
      steps,
      ctx,
      log: (m) => this.log(m),
      dryRun: flags.dryRun,
      force: flags.force,
      conflict: flags.conflict as ConflictPolicy,
      defaults: flags.defaults,
      allowMissingEnv: flags.allowMissingEnv,
    });
  }
}

type ConflictPolicy = "error" | "skip" | "overwrite" | "prompt";

function parseAnswers(pairs: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const pair of pairs) {
    const idx = pair.indexOf("=");
    if (idx === -1)
      throw new Error(`Invalid --answer: ${pair} (expected key=value)`);
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    out[key] = value;
  }

  return out;
}

async function loadTemplate(templateRef: string): Promise<JSONTemplate> {
  if (templateRef.startsWith("http://") || templateRef.startsWith("https://")) {
    const response = await fetch(templateRef);
    if (!response.ok) {
      throw new Error(
        `Failed to download template: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as JSONTemplate;
  }

  const raw = await fs.readFile(path.resolve(templateRef), "utf8");
  return JSON.parse(raw) as JSONTemplate;
}

async function collectAnswers(args: {
  questions: TemplateQuestion[];
  ctx: ReturnType<typeof buildInitialContext>;
  defaults: boolean;
}): Promise<void> {
  for (const q of args.questions) {
    if (!evaluateCondition(args.ctx, q.when)) continue;

    if (q.id in args.ctx.answers) continue;

    if (args.defaults) {
      if (q.default !== undefined) {
        args.ctx.answers[q.id] = q.default;
        continue;
      }

      if (q.required) throw new Error(`Missing required answer: ${q.id}`);
      continue;
    }

    args.ctx.answers[q.id] = await promptForQuestion(q);

    if (
      q.required &&
      (args.ctx.answers[q.id] === "" || args.ctx.answers[q.id] == null)
    ) {
      throw new Error(`Missing required answer: ${q.id}`);
    }
  }
}

async function promptForQuestion(q: TemplateQuestion): Promise<unknown> {
  switch (q.type) {
    case "input":
      return await input({
        message: q.message,
        default: typeof q.default === "string" ? q.default : undefined,
      });
    case "confirm":
      return await confirm({
        message: q.message,
        default: typeof q.default === "boolean" ? q.default : undefined,
      });
    case "select": {
      const choices = (q.options ?? []).map((o) => ({
        name: o.label,
        value: o.value,
      }));
      return await select({
        message: q.message,
        choices,
        default: typeof q.default === "string" ? q.default : undefined,
      });
    }
    case "multiselect": {
      const defaultValues = new Set(Array.isArray(q.default) ? q.default : []);
      const choices = (q.options ?? []).map((o) => ({
        name: o.label,
        value: o.value,
        checked: defaultValues.has(o.value),
      }));

      return await checkbox({ message: q.message, choices });
    }
  }
}

async function executeSteps(args: {
  steps: TemplateStep[];
  ctx: ReturnType<typeof buildInitialContext>;
  log: (message: string) => void;
  dryRun: boolean;
  force: boolean;
  conflict: ConflictPolicy;
  defaults: boolean;
  allowMissingEnv: boolean;
}): Promise<void> {
  for (const step of args.steps) {
    if (!evaluateCondition(args.ctx, step.when)) continue;

    switch (step.type) {
      case "copy": {
        const target = resolveTargetPath(
          args.ctx.outDir,
          interpolate(step.target, args.ctx),
        );
        const src = await resolveSource(interpolate(step.source, args.ctx));

        if (args.dryRun) {
          args.log(`copy ${step.source} -> ${target}`);
          break;
        }

        const policy = effectiveConflictPolicy(args);

        if (src.kind === "dir") {
          const decision = await handleDirConflict({
            policy,
            target,
            defaults: args.defaults,
          });

          if (!decision.proceed) {
            args.log(`skip copy ${step.source} -> ${target} (exists)`);
            break;
          }

          const force =
            policy === "overwrite" || args.force || Boolean(decision.overwrite);

          await copyDirWithTransforms(src.path, target, {
            ctx: args.ctx,
            force,
            include: step.include,
            exclude: step.exclude,
            rename: step.rename,
            render: step.render,
          });
        } else {
          // If target ends with '/', treat it as directory and keep filename
          const finalTarget = looksLikeDirTarget(step.target)
            ? path.join(
                target,
                applyRenameToBasename(
                  path.basename(src.path),
                  step.rename,
                  args.ctx,
                ),
              )
            : target;

          const decision = await handleFileConflict({
            policy,
            target: finalTarget,
            defaults: args.defaults,
          });

          if (!decision.proceed) {
            args.log(`skip copy ${step.source} -> ${finalTarget} (exists)`);
            break;
          }

          const force =
            policy === "overwrite" || args.force || Boolean(decision.overwrite);

          const shouldRender = Boolean(
            step.render &&
            (() => {
              const rel = path.basename(src.path).replaceAll("\\", "/");
              const include = picomatch(step.render.include, { dot: true });
              const exclude = step.render.exclude?.length
                ? picomatch(step.render.exclude, { dot: true })
                : null;
              return include(rel) && !exclude?.(rel);
            })(),
          );
          await copyFileMaybeRender(src.path, finalTarget, {
            ctx: args.ctx,
            force,
            render: shouldRender,
          });
        }

        break;
      }

      case "move": {
        const from = resolveTargetPath(
          args.ctx.outDir,
          interpolate(step.from, args.ctx),
        );
        const to = resolveTargetPath(
          args.ctx.outDir,
          interpolate(step.to, args.ctx),
        );

        if (args.dryRun) {
          args.log(`move ${from} -> ${to}`);
          break;
        }

        if (!(await pathExists(from))) {
          throw new Error(`Move source does not exist: ${from}`);
        }

        const policy = effectiveConflictPolicy(args);
        const decision = await handleFileConflict({
          policy,
          target: to,
          defaults: args.defaults,
        });

        if (!decision.proceed) {
          args.log(`skip move ${from} -> ${to} (exists)`);
          break;
        }

        if (decision.overwrite && (await pathExists(to))) {
          await fs.rm(to, { recursive: true, force: true });
        }

        await ensureDir(path.dirname(to));
        await movePath(from, to);
        break;
      }

      case "merge": {
        const target = resolveTargetPath(
          args.ctx.outDir,
          interpolate(step.target, args.ctx),
        );
        const src = await resolveSource(interpolate(step.source, args.ctx));

        if (src.kind !== "file")
          throw new Error("merge source must resolve to a file");

        if (args.dryRun) {
          args.log(`merge ${step.source} -> ${target}`);
          break;
        }

        await mergeIntoTarget(src.path, target, step.merge ?? {});
        break;
      }

      case "environment": {
        const target = resolveTargetPath(
          args.ctx.outDir,
          interpolate(step.target, args.ctx),
        );

        if (args.dryRun) {
          args.log(`environment ${target}`);
          break;
        }

        await applyEnvironmentReplacements(target, step.variables, {
          allowMissing: args.allowMissingEnv,
        });
        break;
      }

      case "command": {
        const cwd = resolveTargetPath(
          args.ctx.outDir,
          step.workingDirectory
            ? interpolate(step.workingDirectory, args.ctx)
            : args.ctx.outDir,
        );
        const cmd = interpolate(step.command, args.ctx);

        if (args.dryRun) {
          args.log(`command (${cwd}): ${cmd}`);
          break;
        }

        await runShellCommand(cmd, cwd);
        break;
      }
    }
  }
}

async function movePath(from: string, to: string): Promise<void> {
  try {
    await fs.rename(from, to);
    return;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code !== "EXDEV") throw error;
  }

  // Cross-device fallback.
  const stat = await fs.stat(from);
  if (stat.isDirectory()) {
    await fs.cp(from, to, { recursive: true, force: true });
    await fs.rm(from, { recursive: true, force: true });
    return;
  }

  await fs.copyFile(from, to);
  await fs.rm(from, { force: true });
}

function effectiveConflictPolicy(args: {
  conflict: ConflictPolicy;
  defaults: boolean;
}): ConflictPolicy {
  // If user asked for no prompting, don't prompt on conflicts.
  if (args.defaults && args.conflict === "prompt") return "error";
  return args.conflict;
}

async function handleFileConflict(args: {
  policy: ConflictPolicy;
  target: string;
  defaults: boolean;
}): Promise<{ proceed: boolean; overwrite: boolean }> {
  const exists = await pathExists(args.target);
  if (!exists) return { proceed: true, overwrite: false };

  switch (args.policy) {
    case "overwrite":
      return { proceed: true, overwrite: true };
    case "skip":
      return { proceed: false, overwrite: false };
    case "error":
      throw new Error(`Target exists: ${args.target}`);
    case "prompt":
      return (await confirm({
        message: `Overwrite ${args.target}?`,
        default: false,
      }))
        ? { proceed: true, overwrite: true }
        : { proceed: false, overwrite: false };
  }
}

async function handleDirConflict(args: {
  policy: ConflictPolicy;
  target: string;
  defaults: boolean;
}): Promise<{ proceed: boolean; overwrite: boolean }> {
  const exists = await pathExists(args.target);
  if (!exists) return { proceed: true, overwrite: false };

  switch (args.policy) {
    case "overwrite":
      return { proceed: true, overwrite: true };
    case "skip":
      return { proceed: false, overwrite: false };
    case "error":
      throw new Error(`Target exists: ${args.target}`);
    case "prompt":
      return (await confirm({
        message: `Directory exists. Merge/overwrite into ${args.target}?`,
        default: false,
      }))
        ? { proceed: true, overwrite: true }
        : { proceed: false, overwrite: false };
  }
}
