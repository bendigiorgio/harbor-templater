# Website / Docs + Template Builder Tasks

## Goals

- Host project documentation as a website.
- Provide a visual builder for `*.template.json` files that outputs valid JSON matching our schema.
- Keep the published npm package clean (no site artifacts shipped).
- Deploy the site to GitHub Pages.

## Constraints / Non-goals

- Do not change the CLI’s runtime dependencies for the sake of the website.
- The website should live in a clearly separated folder (e.g. `site/` or `website/`) with its own `package.json`.
- The npm package should continue to publish only the CLI build outputs.

## Proposed Repo Layout

- `site/` — Astro + Starlight site (separate project)
- `docs/` — source docs already in repo; either:
  - referenced/copied into the site as Starlight content, or
  - migrated into `site/src/content/docs/**` over time

## Decisions (Locked In)

- Site folder: `site/`
- Package layout: separate project under `site/` (no pnpm workspace/monorepo for now)
- Deploy target: GitHub Pages project site (`https://bendigiorgio.github.io/harbor-templater/`)
- Deploy trigger: releases only
- Base path: Astro `base: "/harbor-templater/"`
- Docs source-of-truth: keep markdown in `docs/` and sync/copy into Starlight content as needed
- Schema source-of-truth: `docs/template.schema.json` (synced into the site for use at runtime)
- Builder approach: schema-driven UI (recommended: `@rjsf/core` + `@rjsf/validator-ajv8`)

## Tasks

### Phase 0 — Decisions

- [x] Pick folder name: `site/`.
- [x] Pick URL strategy: GitHub Pages project site: `https://bendigiorgio.github.io/harbor-templater/`
- [x] Deploy trigger: releases only.
- [x] Decide on workspace strategy: no pnpm workspaces/monorepo for now.
- [x] Decide base path: Astro `base: "/harbor-templater/"`.
- [x] Decide builder approach: schema-driven UI (recommended: `@rjsf/core`).

### Phase 1 — Add Astro + Starlight

- [ ] Scaffold the Starlight theme via Astro’s starter for “Starlight”.
- [ ] Ensure the site can be built with `pnpm -C site build`.
- [ ] Set `site` + `base` appropriately for GitHub Pages project sites (base typically `/harbor-templater/`).
- [ ] Add `site/README.md` with local dev instructions.

### Phase 2 — Docs Content

- [ ] Create initial docs IA (Information Architecture):
  - [ ] Introduction / install / quickstart
  - [ ] Template JSON reference
  - [ ] Examples (link to `docs/examples/**`)
  - [ ] CLI reference (generated or curated)
- [ ] Migrate or mirror existing markdown docs:
  - [ ] `docs/README.md`
  - [ ] `docs/template-json.md`
  - [ ] `docs/conventional-commits.md` (if it belongs on the site)
- [ ] Add navigation + sidebar configuration.

### Phase 3 — Visual Template Builder (MVP)

- [ ] Add a “Template Builder” page in the site.
- [ ] Load and display our JSON schema from `docs/template.schema.json`.
- [ ] Build a schema-driven form UI:
  - [ ] Add/remove entries for arrays
  - [ ] Optional fields and defaults
  - [ ] Enum selectors
- [ ] Provide a live JSON preview (read-only) and “Copy to clipboard”.
- [ ] Validate output against the schema (client-side) and show clear error messages.
- [ ] Export options:
  - [ ] Download as `template.json`
  - [ ] Copy to clipboard

### Phase 4 — Builder UX Improvements

- [ ] Import an existing template JSON and populate the form.
- [ ] Integrate “examples” as one-click starting points (from `docs/examples/*.template.json`).
- [ ] Add “diff / changes” view (optional).
- [ ] Add optional advanced editor (Monaco or textarea) with validation.

### Phase 5 — Keep npm Package Clean

Current state: root `package.json` uses the `files` field, publishing only:

- `./bin`
- `./dist`
- `./oclif.manifest.json`

Tasks:

- [ ] Confirm `npm pack --dry-run` does NOT include the site folder.
- [ ] Ensure site build output stays inside `site/dist` (or equivalent) and is not referenced by CLI builds.
- [ ] Add/verify `.gitignore` entries for site-only artifacts:
  - [ ] `site/node_modules`
  - [ ] `site/dist`
  - [ ] `site/.astro`

(We can add `.npmignore` later only if needed; the `files` allowlist is usually the cleanest approach.)

### Phase 6 — GitHub Pages Deployment

- [ ] Add a GitHub Actions workflow to build and deploy `site/` to Pages.
- [ ] Use Pages artifact upload + deploy action.
- [ ] Configure caching for pnpm.
- [ ] Ensure the workflow runs on published releases.
- [ ] Verify the site works with the correct base path on Pages.

## Acceptance Criteria (MVP)

- [ ] `pnpm -C site dev` runs locally.
- [ ] `pnpm -C site build` succeeds.
- [ ] Docs are browsable and searchable.
- [ ] Builder can generate a valid `template.json` and validate it against `docs/template.schema.json`.
- [ ] GitHub Pages publishes the site.
- [ ] `npm pack --dry-run` for the CLI package does not include `site/`.
