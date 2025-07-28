# Empack

An Express-based web server framework.

## Description

Empack is a **lightweight**, **Nest-like** backend web framework built on top of **Express**. It aims to deliver a structured and scalable development experience while remaining simple and unobtrusive. Developers can focus on building business logic without getting bogged down by server configuration or boilerplate code.

Unlike NestJS, Empack focuses on minimalism and fast setup, making it ideal for small to medium-sized projects that value simplicity and flexibility.

Empack is fully compatible with the existing Express ecosystem, allowing you to use popular Express middleware, libraries, and tools out of the box.

It includes a built-in **dependency injection (DI) container** powered by [Inversify](https://github.com/inversify/InversifyJS), **route-based WebSocket support**, a **mediator pattern** implementation for CQRS, and **automatic OpenAPI documentation generation**.

With **TypeScript decorators**, Empack simplifies the registration of controllers, routes, openAPI, and more. Its built-in mediator allows for clean separation of concerns and full decoupling between controllers and business logic—making CQRS and modular architecture easy to adopt.

## Installation

```bash
npm i @empackjs/core
```

## Documentation

For more information, see the [documentation](https://empackjs.github.io/empack/)
