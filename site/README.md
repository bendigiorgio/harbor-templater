# harbor-templater site

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

Documentation site + (eventual) visual template builder for `harbor-templater`.

## Project Structure

Inside of your Astro + Starlight project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in `src/content/docs/`. Each file becomes a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## Commands

All commands are run from the repo root, from a terminal:

| Command                | Action                                      |
| :--------------------- | :------------------------------------------ |
| `pnpm -C site install` | Installs dependencies                       |
| `pnpm -C site dev`     | Starts local dev server at `localhost:4321` |
| `pnpm -C site build`   | Builds production site to `site/dist/`      |
| `pnpm -C site preview` | Previews the build locally                  |

## Notes

- GitHub Pages uses the project base path `/harbor-templater/`.
- Schema is sourced from `docs/template.schema.json` in the repo.
