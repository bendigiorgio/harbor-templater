export type JSONTemplate = {
  author?: string;
  description?: string;
  name: string;
  version: string;
  questions?: TemplateQuestion[];
  steps: TemplateStep[];
};

export type TemplateQuestion = {
  id: string;
  type: "input" | "confirm" | "select" | "multiselect";
  message: string;
  default?: string | boolean | string[];
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  when?: Condition;
};

export type TemplateStep = CopyStep | MergeStep | EnvironmentStep | CommandStep;

type StepBase = {
  when?: Condition;
};

export type CopyStep = StepBase & {
  type: "copy";
  source: string; // remote file/folder reference
  target: string; // local path (may include interpolation)
  exclude?: string[]; // glob patterns (applies when source resolves to a directory)
};

export type MergeStep = StepBase & {
  type: "merge";
  source: string; // remote file reference
  target: string; // local file path
  merge?: {
    format?: "json" | "yaml" | "text";
    strategy?: "deep" | "shallow" | "append" | "prepend";
  };
};

export type EnvironmentStep = StepBase & {
  type: "environment";
  target: string; // local file path
  variables: Record<string, string>; // ENV_NAME -> placeholder string in the file
};

export type CommandStep = StepBase & {
  type: "command";
  command: string;
  workingDirectory?: string;
};

export type ValueRef = {
  ref: string; // e.g. "answers.useReact"
};

export type Condition =
  | { op: "eq" | "neq"; left: ValueRef; right: unknown }
  | { op: "in" | "notIn"; left: ValueRef; right: unknown[] }
  | { op: "truthy" | "falsy" | "exists"; value: ValueRef }
  | { op: "and" | "or"; conditions: Condition[] }
  | { op: "not"; condition: Condition };
