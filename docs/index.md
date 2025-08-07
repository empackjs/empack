---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Empack"
  text: "A fastify-based web server framework"
  tagline: The framework is designed to provide an easy and lightweight development experience.
  image:
    src: /logo.svg 
    alt: EmpackLogo
  actions:
    - theme: brand
      text: What is Empack
      link: /introduction/what-is-empack
    - theme: alt
      text: Getting Started
      link: /guides/getting-started
features:
  - title: Fastify-Compatible
    details: Fully compatible with existing Fastify ecosystem — integrate or migrate without friction.
  - title: Modular DI Architecture
    details: Supports singleton, transient, and request-scoped lifecycles. Combined with lazy middleware resolution for high performance and clean structure.
  - title: Type-Safe Decorators
    details: Define routes using intuitive decorators like @Controller, @Get, and @Post, with full support for parameter binding and type inference.
  - title: Built-in Mediator Support
    details: Implements the mediator pattern to decouple controllers from application services. Controllers focus only on input/output while business logic lives in dedicated handlers.
---

