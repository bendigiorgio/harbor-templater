import { useEffect, useMemo, useState, type JSX } from "react";
import Form, { type IChangeEvent } from "@rjsf/core";
import type {
  ArrayFieldItemButtonsTemplateProps,
  ArrayFieldItemTemplateProps,
  ArrayFieldTemplateProps,
  RJSFSchema,
} from "@rjsf/utils";
import { customizeValidator } from "@rjsf/validator-ajv8";
import Ajv2020 from "ajv/dist/2020";

const validator = customizeValidator({ AjvClass: Ajv2020 });

function ArrayFieldItemButtonsTemplate(
  props: ArrayFieldItemButtonsTemplateProps,
): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {props.hasMoveUp ? (
        <button
          type="button"
          onClick={props.onMoveUpItem}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Up
        </button>
      ) : null}

      {props.hasMoveDown ? (
        <button
          type="button"
          onClick={props.onMoveDownItem}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Down
        </button>
      ) : null}

      {props.hasCopy ? (
        <button
          type="button"
          onClick={props.onCopyItem}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-800 text-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Copy
        </button>
      ) : null}

      {props.hasRemove ? (
        <button
          type="button"
          onClick={props.onRemoveItem}
          className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-800 text-xs hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

function ArrayFieldItemTemplate(
  props: ArrayFieldItemTemplateProps,
): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
      {props.hasToolbar ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="font-semibold text-slate-700 text-xs dark:text-slate-300">
            Item {props.index + 1}
          </div>
          <ArrayFieldItemButtonsTemplate {...props.buttonsProps} />
        </div>
      ) : null}
      <div className="min-w-0">{props.children}</div>
    </div>
  );
}

function ArrayFieldTemplate(props: ArrayFieldTemplateProps): JSX.Element {
  const title = props.title;
  const required = props.required;
  const emptyLabel = title ? `No ${title.toLowerCase()} yet.` : "No items yet.";

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 text-sm dark:text-slate-100">
            {title}
            {required ? <span className="ml-1 text-red-600">*</span> : null}
          </div>
          {props.schema?.description ? (
            <div className="mt-1 text-slate-600 text-xs dark:text-slate-300">
              {props.schema.description}
            </div>
          ) : null}
        </div>

        {props.canAdd ? (
          <button
            type="button"
            onClick={props.onAddClick}
            className="inline-flex items-center rounded-md bg-sky-600 px-2.5 py-1.5 font-semibold text-white text-xs shadow-sm hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          >
            + Add
          </button>
        ) : null}
      </div>

      {props.items.length ? (
        <div className="grid gap-3">{props.items}</div>
      ) : (
        <div className="rounded-lg border border-slate-300 border-dashed bg-white p-3 text-slate-600 text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          {emptyLabel} Click <span className="font-semibold">+ Add</span> to
          create one.
        </div>
      )}

      {props.rawErrors?.length ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-900 text-xs dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          {props.rawErrors.join("\n")}
        </div>
      ) : null}
    </div>
  );
}

type BuilderState = {
  schema: RJSFSchema | null;
  schemaError: string | null;
  formData: unknown;
  inputJsonText: string;
  inputJsonError: string | null;
  copied: boolean;
};

const SCHEMA_URL =
  "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json";

const DEFAULT_TEMPLATE: Record<string, unknown> = {
  $schema:
    "https://raw.githubusercontent.com/bendigiorgio/harbor-templater/main/docs/template.schema.json",
  name: "My Template",
  version: "0.1.0",
  questions: [],
  steps: [],
};

function safeStringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function tryParseJson(
  text: string,
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([safeStringifyJson(value)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

export function TemplateBuilder(): JSX.Element {
  const [state, setState] = useState<BuilderState>({
    schema: null,
    schemaError: null,
    formData: DEFAULT_TEMPLATE,
    inputJsonText: safeStringifyJson(DEFAULT_TEMPLATE),
    inputJsonError: null,
    copied: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSchema() {
      try {
        const response = await fetch(SCHEMA_URL);
        if (!response.ok) {
          throw new Error(
            `Failed to load schema: ${response.status} ${response.statusText}`,
          );
        }

        const schemaJson = (await response.json()) as RJSFSchema;
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            schema: schemaJson,
            schemaError: null,
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            schema: null,
            schemaError: error instanceof Error ? error.message : String(error),
          }));
        }
      }
    }

    void loadSchema();

    return () => {
      cancelled = true;
    };
  }, []);

  const outputJsonText = useMemo(
    () => safeStringifyJson(state.formData),
    [state.formData],
  );

  const onChange = (event: IChangeEvent) => {
    setState((prev) => ({
      ...prev,
      formData: event.formData,
      inputJsonText: safeStringifyJson(event.formData),
      inputJsonError: null,
      copied: false,
    }));
  };

  const applyJsonText = () => {
    const result = tryParseJson(state.inputJsonText);
    if (!result.ok) {
      setState((prev) => ({ ...prev, inputJsonError: result.error }));
      return;
    }

    setState((prev) => ({
      ...prev,
      formData: result.value,
      inputJsonError: null,
      copied: false,
    }));
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      formData: DEFAULT_TEMPLATE,
      inputJsonText: safeStringifyJson(DEFAULT_TEMPLATE),
      inputJsonError: null,
      copied: false,
    }));
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputJsonText);
      setState((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setState((prev) => ({ ...prev, copied: false })), 1200);
    } catch {
      // Clipboard can be blocked; fallback to nothing.
    }
  };

  return (
    <div className="grid gap-4">
      <p className="text-slate-600 text-sm dark:text-slate-300">
        This is an in-browser editor for Harbor template JSON files. It is
        schema-driven and runs entirely in your browser.
      </p>

      {state.schemaError ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-950 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
          <div className="font-semibold">Could not load schema</div>
          <div className="mt-2 whitespace-pre-wrap font-mono text-xs">
            {state.schemaError}
          </div>
          <div className="mt-2 text-xs">
            Expected schema at <code className="font-mono">{SCHEMA_URL}</code>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadJson("template.json", state.formData)}
          className="mt-4 inline-flex items-center rounded-md bg-sky-600 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:cursor-pointer hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70 dark:focus:ring-sky-500/60"
        >
          Download JSON
        </button>
        <button
          type="button"
          onClick={copyOutput}
          className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 font-semibold text-sm text-white shadow-sm hover:cursor-pointer hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/70 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
        >
          {state.copied ? "Copied" : "Copy JSON"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-900 text-sm hover:cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/70 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-1 lg:items-start">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <h2 className="mt-0 font-semibold text-base">Form</h2>
          {state.schema ? (
            <Form
              schema={state.schema}
              validator={validator}
              formData={state.formData}
              onChange={onChange}
              liveValidate={false}
              className="rjsf"
              templates={{
                ArrayFieldTemplate,
                ArrayFieldItemTemplate,
                ArrayFieldItemButtonsTemplate,
              }}
            />
          ) : (
            <div className="flex items-center gap-2 text-slate-600 text-sm dark:text-slate-300">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-slate-700 dark:border-t-transparent" />
              Loading schema...
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <h2 className="mt-0 font-semibold text-base">JSON</h2>

          <div className="grid gap-2">
            <label className="grid gap-2">
              <div className="font-semibold text-slate-900 text-sm dark:text-slate-100">
                Edit/paste template JSON
              </div>
              <textarea
                value={state.inputJsonText}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    inputJsonText: e.target.value,
                    inputJsonError: null,
                    copied: false,
                  }))
                }
                rows={14}
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-slate-900 text-xs leading-5 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyJsonText}
                className="inline-flex items-center rounded-md bg-slate-100 px-3 py-2 font-semibold text-slate-900 text-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/70 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Apply JSON to form
              </button>
            </div>

            {state.inputJsonError ? (
              <div className="whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 p-2 font-mono text-red-950 text-xs dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                {state.inputJsonError}
              </div>
            ) : null}
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer font-semibold text-slate-900 text-sm dark:text-slate-100">
              Current JSON (read-only)
            </summary>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 shadow-inner dark:border-slate-800 dark:bg-slate-950">
              <code className="font-mono text-slate-900 dark:text-slate-100">
                {outputJsonText}
              </code>
            </pre>
          </details>
        </section>
      </div>

      <p className="text-slate-600 text-sm dark:text-slate-300">
        Note: This builder does not execute templates. Use the CLI with{" "}
        <code className="font-mono">--dryRun</code> to preview actions.
      </p>
    </div>
  );
}
