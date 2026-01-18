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

Required GitHub repo secrets:

- `NPM_TOKEN`: npm token with publish access

GitHub automatically provides `GITHUB_TOKEN` to create releases and push changelog/README commits.
