import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Empack",
  description: "Empack",
  base: "/empack/",
  lang: "en-us",
  head: [["link", { rel: "icon", href: "/empack/favicon.ico" }]],
  locales: {
    root: {
      label: "English",
      lang: "en-us",
      link: "/",
      themeConfig: {
        outline: [2, 3],
        nav: [{ text: "Guides", link: "/guides/getting-started" }],
        sidebar: [
          {
            text: "Introduction",
            items: [
              {
                text: "What is Empack",
                link: "/introduction/what-is-empack",
              },
            ],
          },
          {
            text: "Guides",
            items: [
              {
                text: "Getting Started",
                link: "/guides/getting-started",
              },
              {
                text: "Controller",
                link: "/guides/controller",
              },
              {
                text: "Middleware",
                link: "/guides/middleware",
              },
              {
                text: "DI Container",
                link: "/guides/di-container",
              },
              {
                text: "Mediator",
                link: "/guides/mediator",
              },
              {
                text: "OpenAPI",
                link: "/guides/open-api",
              },
            ],
          },
        ],
        socialLinks: [
          { icon: "github", link: "https://github.com/empackjs/empack" },
        ],
      },
    },
  },
});
