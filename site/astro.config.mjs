// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";
import starlightLlmsTxt from "starlight-llms-txt";
import starlightChangelogs from "starlight-changelogs";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://bendigiorgio.github.io",
  base: "/harbor-templater/",
  vite: {
    ssr: {
      noExternal: [/^nanoid(\/.*)?$/],
    },

    // @ts-ignore
    plugins: [tailwindcss()],
  },
  integrations: [
    react(),
    starlight({
      title: "Harbor Templater",
      description: "Documentation for using the Harbor Templater CLI.",
      defaultLocale: "root",
      plugins: [
        starlightLlmsTxt({
          rawContent: true,
        }),
        starlightChangelogs(),
      ],
      customCss: ["/src/styles/globals.css"],
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        ja: {
          label: "日本語",
          lang: "ja",
        },
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/bendigiorgio/harbor-templater",
        },
      ],
      sidebar: [
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Examples",
          autogenerate: { directory: "examples" },
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
        {
          label: "Changelog",
          link: "changelog/",
        },
        {
          label: "llms.txt",
          collapsed: true,
          items: [
            {
              label: "llms.txt",
              link: "llms.txt",
            },
            {
              label: "llms-small.txt",
              link: "llms-small.txt",
            },
            {
              label: "llms-full.txt",
              link: "llms-full.txt",
            },
          ],
        },
      ],
    }),
  ],
});
