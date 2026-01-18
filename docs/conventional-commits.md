# Conventional Commits + Releases

This repo uses:

- **Conventional Commits** for commit message format
- **semantic-release** to automatically:
  - determine the next semver version
  - generate / update `CHANGELOG.md`
  - create a GitHub Release + tag (`vX.Y.Z`)
  - publish to npm

## Commit message format

Use the Conventional Commits format:

- `feat: add init command` (minor)
- `fix: handle missing env vars` (patch)
- `docs: update template spec` (no release)

Breaking changes:

- `feat!: change template schema`
- or add a footer:
  - `BREAKING CHANGE: ...`

## Local enforcement

We use `husky` + `commitlint` to reject non-conforming commit messages.

## CI release flow

On every push to `main`, GitHub Actions runs semantic-release.

Publishing to npm uses **npm trusted publishing** (OIDC), so you do **not** need a long-lived `NPM_TOKEN` secret.

GitHub automatically provides `GITHUB_TOKEN` to create releases and push changelog/README commits.

Optional secrets:

- `NPM_READ_TOKEN`: read-only token (only needed if installing private npm dependencies in CI)
