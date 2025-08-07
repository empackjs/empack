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
  app.regisger(...)
});
```

### Enable CORS

```ts
app.useCors({ origin: "*" })
```

### Custom Exception & Not Found Handlers

Handle uncaught errors and undefined routes globally:

```ts
app
  .setErrorHandler((err, req, reply) => {
      //...
    })
  .setNotFoundHandler((req, reply) => {
     //...
  });
```

### Minimal Example

```ts
export type Env = {
  PORT: string;
  DOWNLOAD_PATH: string;
};

dotenv.config({
  path: path.join(__dirname, ".env.example"),
});

const app = App.createBuilder();
app.setDotEnv();
app.enableSwagger({
  routePrefix: "/docs",
  openapi: {
    info: {
      title: "Empack",
      description: "Empack API DOCS",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "local",
      },
    ],
  },
});
app.addConstant(
  JWT_TOKEN,
  new JwTokenHelper({
    secret: "secret",
  }),
);
app.enableAuthGuard(jwtGuard("secret"));
app.mapController([AuthController]);
app.enableWebSocket([ChatGateway]);
app.setErrorHandler(ErrorHandler);
app.setNotFoundHandler(NotFoundHandler);
app.run(parseInt(app.env.get("PORT")));
```
