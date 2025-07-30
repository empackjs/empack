# Middleware

Empack middleware works similarly to Express middleware but with support for:

* Class-based middleware with full Dependency Injection (DI)
* Route-level、controller-level and app-level middleware
* request-scoped dependencies
* Built-in support for guards and file uploads

## Middleware Types

There are two main ways to define middleware in Empack:

### 1. Function-style middleware (Express-compatible)

```ts
const loggerMiddleware: EmpackMiddlewareFunction = (req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
};

app.useMiddleware(loggerMiddleware);
```

This style is mostly used for global middleware, such as CORS, parsers, static serving, etc.

### Class-style middleware (with DI)

```ts
export class LoggerMiddleware implements EmpackMiddleware {
  construct(private logger: Logger) {}

  async use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(`[${req.method}] ${req.url}`);
    next();
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

>[!NOTE]
Class-based middleware is only available at controller/route level, and supports full DI — including request-scoped classes.

## Global Middleware Cannot Use DI

Global middleware registered via app.useMiddleware(...) must be function-style.
They do not go through Empack's container system and cannot use dependency injection.

```ts
// ✅ Allowed
app.useMiddleware((req, res, next) => {
  console.log("Global middleware");
  next();
});

// ❌ Not supported
app.useMiddleware(SomeClassBasedMiddleware); // will not be injected
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
[Global App Middleware]
        ↓
[Controller Middleware]
        ↓
[Route Middleware]
```

This ensures shared logic (like logging or headers) can be applied globally,
while per-controller or per-route logic stays modular and focused.
