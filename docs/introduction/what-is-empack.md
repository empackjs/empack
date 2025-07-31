# Empack

A lightweight, Express-based web server framework.

## Description

**Empack** is a modern alternative to NestJS, designed for developers who want structure and productivity without the overhead of complex abstractions.

Built on top of Express, Empack provides a familiar development model with TypeScript decorators, dependency injection, and built-in support for WebSocket routing and CQRS — while maintaining minimalism and full control.

Unlike NestJS, Empack focuses on **zero-friction development**, helping you stay close to business logic without being tied to rigid module systems or extensive boilerplate.

Empack is fully compatible with the Express ecosystem, so you can use your favorite middleware, libraries, and tools without modification.

### ✨ Key Features

- ⚡ A DI container powered by Inversify (supports `singleton`, `transient`, and `request-scope`)
- 🔌 Middleware and controller injection with shared request container
- 📡 Route-based WebSocket controller support with per-connection DI
- 🧩 CQRS via built-in Mediator pattern (with `@HandleFor()` decorators)
- 📃 Automatic OpenAPI generation from decorators
- 🧱 Minimal abstractions — no modules, no lifecycle complexity

---

## 🔍 Empack vs NestJS: Key Differences

| Feature / Design Aspect        | **Empack**                                                            | **NestJS**                                                               |
|-------------------------------|------------------------------------------------------------------------|---------------------------------------------------------------------------|
| 🧱 Base Architecture           | Built directly on Express (thin abstraction)                          | Built on Express or Fastify with heavy abstraction                        |
| 💉 Dependency Injection        | Custom DI with `singleton`, `transient`, and `request-scope`          | Built-in DI, limited request-scope, not supported in middleware           |
| ⚙️ Middleware Injection        | Middleware shares the request container with controllers               | Middleware is singleton; request-scoped injection not supported           |
| 📡 WebSocket Routing           | Path-based, DI + auth per connection                                  | Centralized gateway (singleton), namespace-based routing                  |
| 📦 Module System               | No modules — all components wired via DI                              | Requires all providers/controllers to be registered in `@Module()`        |

**Empack** aims to strike a balance between Express's flexibility and NestJS's structure — offering:

- Request-scoped DI everywhere (controllers, middleware, WebSocket)
- Lazy middleware resolution
- Zero module registration
- Minimal but powerful decorators
- Seamless integration with existing Express middleware and tools
