# Middleware

Empack middleware works similarly to Express middleware but with support for:

* Class-based middleware with full Dependency Injection (DI)
* Route-level、controller-level and app-level middleware
* request-scoped dependencies

## Middleware Types

There are two main ways to define middleware in Empack:

### 1. Function-style middleware

```ts
const loggerMiddleware: EmpackMiddlewareFunction = (req: FastifyRequest) => {
  console.log(`[${req.method}] ${req.url}`);
};

app.useMiddleware(loggerMiddleware);
```

This style is mostly used for global middleware, such as CORS, parsers, static serving, etc.

### 2. Class-style middleware (with DI)

```ts
export class LoggerMiddleware implements IEmpackMiddleware {
  constructor(private logger: Logger) {}

  async use(req: FastifyRequest) {
    this.logger.log(`[${req.method}] ${req.url}`);
  }
}
```

To apply this middleware to a controller:

```ts
@Controller("/user", LoggerMiddleware)
export class UserController {
  @Get("/")
  getUser() {
    return Responses.OK("User route")
  }
}
```

## Middleware Execution Order

Empack runs middleware in a well-defined order:

1. App-level middleware (`app.useMiddleware(...)`)
2. Controller-level middleware (`@Controller("/", ...middleware)`)
3. Route-level middleware (`@Get("/", ...middleware)`)

This means:

* App-level middleware runs for all routes
* Controller-level middleware runs only for that controller’s routes
* Route-level middleware runs only for that specific route

Here’s a typical middleware execution flow:

```
[Guard Middleware(if any)]
        ↓
[Global App Middleware]
        ↓
[Controller Middleware]
        ↓
[Route Middleware]
```

This ensures shared logic (like logging or headers) can be applied globally,
while per-controller or per-route logic stays modular and focused.
