# What is Empack

**Empack** is a **lightweight alternative to NestJS**, built on top of **Express** with a focus on simplicity, minimalism, and fast developer onboarding. While it offers a familiar, structured development experience like Nest, Empack deliberately avoids heavy abstractions and rigid architecture, making it ideal for small to medium-sized projects that prioritize **flexibility and productivity**.

Unlike NestJS, Empack embraces a **zero-friction** philosophy—helping developers focus on business logic without being constrained by the framework’s structure or boilerplate code.

Empack is fully compatible with the existing Express ecosystem, allowing seamless integration with popular Express middleware, libraries, and tools.

It comes with built-in features including:

* A dependency injection container powered by [Inversify](https://github.com/inversify/InversifyJS)
* Route-based WebSocket support
* A mediator pattern implementation for CQRS
* Automatic OpenAPI documentation generation

With TypeScript decorators, Empack simplifies the registration of controllers, routes, OpenAPI metadata, and more. Its built-in mediator enables a clean separation of concerns, fully decoupling controllers from business logic—making CQRS and modular architecture straightforward to adopt.
