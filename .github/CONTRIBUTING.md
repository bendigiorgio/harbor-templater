# Contributing

Thanks for taking the time to contribute to harbor-templater.

## Before getting started

- Check existing issues and pull requests to avoid duplicates.
- For substantial changes (new behavior, new template features, breaking changes), open an issue first so we can align on approach.
- Use the provided issue and pull request templates. Missing information usually slows reviews.

## How to contribute

We use GitHub Issues and Pull Requests for all discussion and review.

1. Fork the repository.
2. Create a feature branch from `main`.
3. Make your changes.
4. Run tests and checks locally.
5. Open a pull request.

## Getting started

### Prerequisites

- Node.js >= 18
- pnpm (see `packageManager` in `package.json`)

### Install

```sh
pnpm install
```

### Build

```sh
pnpm run build
```

### Test

```sh
pnpm test
```

### Lint / format

```sh
pnpm run check
pnpm run format
```

## Coding conventions

- Keep changes small and focused; separate refactors from behavior changes when possible.
- Prefer readable code over clever code.
- Formatting and linting are handled by Biome (`pnpm run check`).
- Commits should follow Conventional Commits (see [docs/conventional-commits.md](../docs/conventional-commits.md)). Commit messages are validated by commitlint.
- If you change behavior, add or update tests under `test/`.

## Code of Conduct

Be respectful and professional. Harassment and discriminatory behavior are not acceptable in issues, pull requests, or any other project spaces.

## Additional links

- Code: [https://github.com/bendigiorgio/harbor-templater](https://github.com/bendigiorgio/harbor-templater)
- Issues: [https://github.com/bendigiorgio/harbor-templater/issues](https://github.com/bendigiorgio/harbor-templater/issues)
- Pull requests: [https://github.com/bendigiorgio/harbor-templater/pulls](https://github.com/bendigiorgio/harbor-templater/pulls)
- Template JSON spec: [docs/template-json.md](../docs/template-json.md)
- Template schema: [docs/template.schema.json](../docs/template.schema.json)
