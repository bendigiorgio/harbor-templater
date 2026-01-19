import React, { useEffect, useMemo, useState, type JSX } from "react";
import Form, { type IChangeEvent } from "@rjsf/core";
import { type RJSFSchema } from "@rjsf/utils";
import { customizeValidator } from "@rjsf/validator-ajv8";
import Ajv2020 from "ajv/dist/2020";

const validator = customizeValidator({ AjvClass: Ajv2020 });

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
  return JSON.stringify(value, null, 2) + "\n";
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
    <div style={{ display: "grid", gap: "1rem" }}>
      <p>
        This is an in-browser editor for Harbor template JSON files. It is
        schema-driven and runs entirely in your browser.
      </p>

      {state.schemaError ? (
        <div
          style={{
            border: "1px solid var(--sl-color-red)",
            padding: "0.75rem",
            borderRadius: "0.5rem",
          }}
        >
          <strong>Could not load schema</strong>
          <div
            style={{
              marginTop: "0.5rem",
              fontFamily: "var(--sl-font-mono)",
              fontSize: "0.875rem",
            }}
          >
            {state.schemaError}
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            Expected schema at <code>{SCHEMA_URL}</code>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => downloadJson("template.json", state.formData)}
        >
          Download JSON
        </button>
        <button type="button" onClick={copyOutput}>
          {state.copied ? "Copied" : "Copy JSON"}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <section style={{ minWidth: 0 }}>
          <h2 style={{ marginTop: 0 }}>Form</h2>
          {state.schema ? (
            <Form
              schema={state.schema}
              validator={validator}
              formData={state.formData}
              onChange={onChange}
              liveValidate={false}
            />
          ) : (
            <p>Loading schema...</p>
          )}
        </section>

        <section style={{ minWidth: 0 }}>
          <h2 style={{ marginTop: 0 }}>JSON</h2>

          <div style={{ display: "grid", gap: "0.5rem" }}>
            <label>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
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
                style={{
                  width: "100%",
                  fontFamily: "var(--sl-font-mono)",
                  fontSize: "0.875rem",
                }}
              />
            </label>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={applyJsonText}>
                Apply JSON to form
              </button>
            </div>

            {state.inputJsonError ? (
              <div
                style={{
                  color: "var(--sl-color-red)",
                  fontFamily: "var(--sl-font-mono)",
                  fontSize: "0.875rem",
                }}
              >
                {state.inputJsonError}
              </div>
            ) : null}
          </div>

          <details style={{ marginTop: "1rem" }}>
            <summary>Current JSON (read-only)</summary>
            <pre style={{ overflowX: "auto" }}>
              <code>{outputJsonText}</code>
            </pre>
          </details>
        </section>
      </div>

      <p style={{ color: "var(--sl-color-text-accent)", fontSize: "0.9rem" }}>
        Note: This builder does not execute templates. Use the CLI with{" "}
        <code>--dryRun</code> to preview actions.
      </p>
    </div>
  );
}
