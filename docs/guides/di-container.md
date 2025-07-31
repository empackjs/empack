# DI Container

Empack uses [InversifyJS](https://github.com/inversify/InversifyJS) as its Dependency Injection (DI) container, and enhances it to support real-world needs such as:

* Built-in support for `singleton`, `constant`, and `request-scoped` lifecycles
* Fully DI-compatible with **controllers**, **middleware**, **mediator handlers**, and **WebSocket controllers**
* Each HTTP request and WebSocket connection uses an isolated **request-scoped container**
* Supports class constructor injection and decorator-based designs

## Global DI Registration

Empack initializes an internal global container during app creation. You can register services as follows:

```ts
const LOGGER_TOKEN = Symbol("logger")
const CONFIG_TOKEN = Symbol("config")

const app = App.createBuilder()
  .addSingleton(LOGGER_TOKEN, Logger)
  .addConstant(CONFIG_TOKEN, configObject);
```

### Available Registration Methods

| Method                       | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `addSingleton(token, Class)` | Registers a singleton (shared across the app)      |
| `addConstant(token, value)`  | Registers a constant value (e.g., config objects)  |

## Lifecycle Scopes Explained

Empack supports three lifecycle scopes when registering or defining injectable classes:

| Scope       | Description                                                                |
| ----------- | -------------------------------------------------------------------------- |
| `singleton` | A single shared instance is created and reused throughout the entire app   |
| `constant`  | A manually provided instance or value, equivalent to singleton             |
| `transient` | A new instance is created each time the class is resolved                  |
| `request`   | A new instance is created per HTTP/WebSocket request                       |



## Injecting Dependencies

### 1. Constructor Injection with Decorators

```ts
@injectable()
export class UserService {
  constructor(@inject(CONFIG_TOKEN) private config: Config) {}
}
```
Add `@injectable()` on your class, and use `@inject(...)` to specify **token or class** in the constructor.

### 2. Auto-binding Support

Empack’s container enables `autobind: true` by default. That means:

If a class is decorated with `@injectable()` and it's injected into another service/controller
the container will automatically resolve it, even if you didn’t bind it manually

```ts
@injectable()
export class ConfigService {
  getAppName() {
    return "Empack App";
  }
}

@injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  getStatus() {
    return {
      name: this.config.getAppName(),
      status: "OK",
    };
  }
}
```

## Request-Scoped

Empack creates a fresh **request-scoped container** for each:

* HTTP request
* WebSocket connection
* Controller invocation
* Middleware execution
* Mediator handler resolution

This ensures isolation and enables safe stateful injection.

### How to specify request scope?

You can register custom request-bound services like this:

```ts
@injectable("request")
export class PostService {
  constructor(private userService: UserService) {}
}
```

### No need to mark Controllers or Handlers

Empack automatically treats the following classes as transient-scoped, meaning they are resolved fresh for each request or event:

* `@Controller()` – for HTTP routes
* `@HandleFor()` – for mediator CQRS handlers
* `@Subscribe()` – for mediator Event handlers
* `@WsController()` – for WebSocket route controllers

No need to manually annotate them with `@injectable()`.
This makes request-level isolation the default for all entry points, with no extra ceremony.

## Pre-registered Tokens in Empack

Empack provides several built-in tokens you can override or extend:

| Token                                        | Description                      |
| -------------------------------------------- | -------------------------------- |
| `APP_TOKEN.ILogger`                          | The default logger instance      |
| `APP_TOKEN.IEnv`                             | The `.env` environment loader    |
| `APP_TOKEN.ISender` / `APP_TOKEN.IPublisher` | The Mediator system’s interfaces |

You can override these via `setLogger(...)`, `setDotEnv()`, etc.

## Example: Injecting Current User

You can combine DI + middleware to inject a per-request CurrentUser:

```ts
@injectable("request")
export class CurrentUser {
  id: string;
  role: string;
}
```

In a middleware:

```ts
export class AuthMiddleware implements EmpackMiddleware {
  constructor(private currentUser: CurrentUser) {}

  async use(req, res, next) {
    this.currentUser.id = req.headers["x-user-id"];
    next();
  }
}
```

Then in a controller:

```ts
@Controller("/posts", AuthMiddleware)
export class PostController {
  constructor(private currentUser: CurrentUser) {}

  @Get("/")
  getAll() {
    return Responses.OK({ userId: this.currentUser.id });
  }
}
```
