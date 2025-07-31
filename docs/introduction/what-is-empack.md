# Empack

An Express-based web server framework.

## Description

**Empack** is a **lightweight alternative to NestJS**, built on top of **Express** with a focus on simplicity, minimalism, and fast developer onboarding. While it offers a familiar, structured development experience like Nest, Empack deliberately avoids heavy abstractions and rigid architecture, making it ideal for small to medium-sized projects that prioritize **flexibility and productivity**.

Unlike NestJS, Empack embraces a **zero-friction** philosophy—helping developers focus on business logic without being constrained by the framework’s structure or boilerplate code.

Empack is fully compatible with the existing Express ecosystem, allowing seamless integration with popular Express middleware, libraries, and tools.

It comes with built-in features including:

* A dependency injection container powered by [Inversify](https://github.com/inversify/InversifyJS)
* Route-based WebSocket support
* A mediator pattern implementation for CQRS
* Automatic OpenAPI documentation generation

With TypeScript decorators, Empack simplifies the registration of controllers, routes, OpenAPI metadata, and more. Its built-in mediator enables a clean separation of concerns, fully decoupling controllers from business logic—making CQRS and modular architecture straightforward to adopt.

## Empack vs NestJS: Key Differences

| Feature / Design Aspect  | **Empack**                                                                 | **NestJS**                                                                   |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 🧱 Base Architecture     | Built directly on Express (thin abstraction)                               | Built on Express or Fastify with heavy abstraction                           |
| 💉 Dependency Injection  | Custom DI container with **singleton / transient / request-scope** support | Built-in DI, request-scope is limited and not supported in middleware        |
| ⚙️ Middleware Injection  | Middleware shares the same request container as controllers                | Middleware is singleton and cannot inject request-scoped providers           |
| 📡 WebSocket Routing     | Path-based routing, per-connection container, DI and auth supported        | Centralized Gateway (singleton), namespace-based only                        |
| 📦 Module System         | No module requirement; everything can be wired via DI                      | Everything must be registered inside a `@Module()`                           |

Empack aims to be the sweet spot between Express's flexibility and NestJS's structure — without the ceremony. It gives you:

* Modern DI with request-scoped injection
* Lazy middleware resolution
* Path-based WebSocket routing with full per-request context
* Minimal but powerful decorators
* Zero need to register modules, or fight the framework
