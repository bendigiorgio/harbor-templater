import path from "node:path";

import type {
  Condition,
  JSONTemplate,
  TemplateQuestion,
  TemplateStep,
  ValueRef,
} from "./template-json.js";

export type TemplateContext = {
  answers: Record<string, unknown>;
  outDir: string;
};

export function buildInitialContext(
  outDir: string,
  initialAnswers?: Record<string, unknown>,
): TemplateContext {
  return {
    answers: { ...(initialAnswers ?? {}) },
    outDir,
  };
}

export function getRefValue(ctx: TemplateContext, ref: ValueRef): unknown {
  const refPath = ref.ref;
  if (!refPath) return undefined;

  const parts = refPath.split(".");
  let current: unknown = ctx;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current !== "object") return undefined;

    const record = current as Record<string, unknown>;
    current = record[part];
  }

  return current;
}

export function evaluateCondition(
  ctx: TemplateContext,
  condition?: Condition,
): boolean {
  if (!condition) return true;

  switch (condition.op) {
    case "eq":
      return getRefValue(ctx, condition.left) === condition.right;
    case "neq":
      return getRefValue(ctx, condition.left) !== condition.right;
    case "in": {
      const value = getRefValue(ctx, condition.left);
      return Array.isArray(condition.right) && condition.right.includes(value);
    }
    case "notIn": {
      const value = getRefValue(ctx, condition.left);
      return Array.isArray(condition.right) && !condition.right.includes(value);
    }
    case "truthy":
      return Boolean(getRefValue(ctx, condition.value));
    case "falsy":
      return !getRefValue(ctx, condition.value);
    case "exists": {
      const value = getRefValue(ctx, condition.value);
      return value !== undefined && value !== null;
    }
    case "and":
      return condition.conditions.every((c) => evaluateCondition(ctx, c));
    case "or":
      return condition.conditions.some((c) => evaluateCondition(ctx, c));
    case "not":
      return !evaluateCondition(ctx, condition.condition);
  }
}

const INTERPOLATION = /\{\{\s*([^}]+?)\s*\}\}/g;

export function interpolate(input: string, ctx: TemplateContext): string {
  return input.replace(INTERPOLATION, (_match, expr: string) => {
    const trimmed = String(expr ?? "").trim();

    // Support {{answers.foo}} and {{outDir}}
    if (trimmed === "outDir") return ctx.outDir;

    // Any other expression is treated as a ref path
    const value = getRefValue(ctx, { ref: trimmed });
    return value == null ? "" : String(value);
  });
}

export function resolveTargetPath(outDir: string, target: string): string {
  return path.isAbsolute(target) ? target : path.resolve(outDir, target);
}

export function templateQuestions(template: JSONTemplate): TemplateQuestion[] {
  return template.questions ?? [];
}

export function templateSteps(template: JSONTemplate): TemplateStep[] {
  return template.steps;
}
