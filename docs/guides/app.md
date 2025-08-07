# App

In this section, we’ll cover the remaining features of the App class in Empack, assuming you've already introduced the following earlier:

* Controller and routing
* Middleware
* Dependency Injection
* Auth Guards
* Multer
* Mediator
* WebSocket
* Schema Validation

## Additional App Configuration Guide

### Load Environment Variables: `setDotEnv()`

Loads `.env` variables and registers them into the DI container as an `IEnv` service:

> [!NOTE]
`setDotEnv()` simply wraps `process.env` and exposes it via `IEnv`.
It does not automatically parse `.env` files.
You should manually load your environment variables using a library like `dotenv` before calling `.setDotEnv()`:

```ts
//main.ts
import dotenv from "dotenv";
dotenv.config({ path: "./config/.env.local" });

App.createBuilder()
  .setDotEnv()

//my.controller.ts
@Controller("/")
class MyController {
  constructor(@inject(APP_TOKEN.IEnv) private env: IEnv) {}

  @Get("/")
  myRoute() {
    const value = this.env.get("environment var");
    return Responses.OK(value)
  }
}
```

### Custom Logger: `setLogger()`

You can inject your own logger that conforms to the `ILogger` interface. It will be auto-bound to the container:

```ts
App.createBuilder()
  .setLogger(myCustomLogger)

@Controller("/")
class MyController {
  constructor(@inject(APP_TOKEN.ILogger) private logger: ILogger) {}

  @Get("/")
  myRoute() {
    this.logger.debug("my log")
    return Responses.OK("log")
  }
}
```

### Serve Static Files: `useStatic()`

Serve frontend assets or any public directory:

```ts
app.useStatic(path.join(__dirname, "../public"));
```

### Global HTTP Headers: `useHeaders()`

Apply consistent headers across all responses, such as cache control or security headers:

```ts
app.useHeaders({
  "X-Powered-By": "Empack",
  "Cache-Control": "no-store",
});
```

### Custom Express Extensions: `useExtension()`

Gives you full access to the underlying Express app for low-level customization:

```ts
app.useExtension((app) => {
  app.disable("x-powered-by");
});
```

### Enable CORS and Body Parsers

Common middleware made simple:

```ts
app
  .useCors({ origin: "*" })
  .useJsonParser()
  .useUrlEncodedParser(); // default is `extended: true`
```

### Custom Exception & Not Found Handlers

Handle uncaught errors and undefined routes globally:

```ts
app
  .setExceptionHandler((err, req) => {
    statusCode: 500,
    body: { error: err.message },
  })
  .setNotFoundHandler((req) => {
    statusCode: 404,
    body: { error: "Route Not Found" },
  });
```

>[!NOTE]
If you provide a handler via `setExceptionHandler()` or `setNotFoundHandler()`,
Empack will automatically register the corresponding middleware internally.
If you don’t, you’re free to define your own handlers using `useMiddleware()`.

>[!WARNING]
However, we do not recommend registering a custom NotFound handler via `useMiddleware()` alone.
Doing so may cause it to be executed before the exception handler, which can lead to unexpected behavior — such as errors being swallowed by the 404 response.
To avoid this, prefer using `setNotFoundHandler()` so Empack can ensure proper middleware order.

### Minimal Example

```ts
App.createBuilder((opt) => {
  opt.routerPrefix = "/api";
  opt.setTimeout = 30_000;
})
  .setDotEnv()
  .setLogger(new Logger())
  .useCors({ origin: "*" })
  .useJsonParser()
  .useUrlEncodedParser()
  .useHeaders({ "X-Powered-By": "Empack" })
  .useStatic("./public")
  .setExceptionHandler((err, _req) => {
    statusCode: 500,
    body: { error: err.message },
  })
  .setNotFoundHandler((req) => {
    statusCode: 404,
    body: { error: `${req.method} ${req.url} Not Found` },
  })
  .mapController([MyController])
  .run(3000);
```
