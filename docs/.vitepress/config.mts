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
                text: "DI Container",
                link: "/guides/di-container",
              },
              {
                text: "Middleware",
                link: "/guides/middleware",
              },
              {
                text: "Guard",
                link: "/guides/guard",
              },
              {
                text: "Multer",
                link: "/guides/multer",
              },
              {
                text: "Mediator",
                link: "/guides/mediator",
              },
              {
                text: "WebSocket",
                link: "/guides/websocket",
              },
              {
                text: "OpenAPI",
                link: "/guides/open-api",
              },
              {
                text: "App",
                link: "/guides/app",
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
