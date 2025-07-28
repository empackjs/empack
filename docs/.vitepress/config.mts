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
        outline: [3, 4],
        nav: [{ text: "Guide", link: "/guide/app" }],
        sidebar: [
          {
            text: "Introduction",
            items: [
              {
                text: "What is Empack",
                link: "/introduction/what-is-empack",
              },
              {
                text: "Getting Started",
                link: "/introduction/getting-started",
              },
            ],
          },
          {
            text: "Guide",
            items: [
              {
                text: "App",
                link: "/guide/app",
              },
              {
                text: "Controller",
                link: "/guide/controller",
              },
              {
                text: "Middleware",
                link: "/guide/middleware",
              },
              {
                text: "DI Container",
                link: "/guide/di-container",
              },
              {
                text: "Mediator",
                link: "/guide/mediator",
              },
              {
                text: "Open API",
                link: "/guide/open-api",
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
