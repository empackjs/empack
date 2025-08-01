# Empack

A lightweight, Express-based web server framework.

## Description

**Empack** is built on top of Express, Empack provides a familiar development model with TypeScript decorators, dependency injection, and built-in support for WebSocket routing and CQRS — while maintaining minimalism and full control.

Empack is fully compatible with the Express ecosystem, so you can use your favorite middleware, libraries, and tools without modification.

### ✨ Key Features

- ⚡ A DI container powered by Inversify (supports `singleton`, `transient`, and `request-scope`)
- 🔌 Middleware and controller injection with shared request container
- 📡 Route-based WebSocket controller support with per-connection DI
- 🧩 CQRS via built-in Mediator pattern (with `@HandleFor()` decorators)
- 📃 Automatic OpenAPI generation from decorators

## Documentation

For more information, see the [documentation](https://empackjs.github.io/empack/)
