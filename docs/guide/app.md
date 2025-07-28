# App

The App class is the core of the Empack framework. It is responsible for initializing and assembling the entire application. It provides a flexible yet structured way to:

- Initialize the Express application
- Register controllers
- Attach middleware
- Set up the dependency injection (DI) container
- Configure Swagger API documentation
- Enable WebSocket controllers
- Start the HTTP server and handle graceful shutdown
- Manage exception and 404 response handling
- Integrate the CQRS mediator and event system

## API

### createBuilder(configure?: (options: AppOptions) => void)

The `createBuilder()` method is the entry point for creating an Empack application. It returns a new App instance and allows you to configure global settings before the server starts.

```ts
const app = App.createBuilder(opt: AppOptions => {
    //options
})
```

#### AppOptions

The `AppOptions` object allows you to customize global application settings.

| Option         | Type     |Default Value| Description                           |
|----------------|----------|-------------|---------------------------------------|
| `routerPrefix` |`string`  |`/api`       | Global prefix for all API routes.     |
| `wsPrefix`     |`string`  |`""`         | Global prefix for all websocket routes|
| `setTimeout`   |`number?` |`undefined`  | Custom timeout for HTTP server.       |

### addSingletonScope(type: symbol, constructor: Newable)

Registers a dependency in singleton scope, meaning it will be created only **once** and reused across the entire application lifecycle.  

```ts
const LOGGER = Symbol("Logger");

class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

app.addSingletonScope(LOGGER, LoggerService)
```

Use this for services or resources that should be **shared globally**, such as:
* Logger
* Database connections
* Configuration services

### addConstant(types: symbol, instance: any)

Registers a pre-instantiated object or value into the DI container. This value will be injected **as Singleton**.

```ts
const CONFIG = Symbol("Config");

const config = {
  baseUrl: "https://api.example.com",
  debug: true,
};

app.addConstant(CONFIG, config);
```

### addRequestScope(type: symbol, constructor: Newable)

Registers a class in request scope. A new instance will be created **for each HTTP or WebSocket request**.

```ts
app.addRequestScope(SvcSymbol, RequestIdService)
```

Use when the service should be isolated per request, such as:

* Current user context
* Request ID or trace ID
* Per-request cache

### addTransientScope(type: symbol, constructor: Newable)

Registers a class in transient scope. A new instance will be created **every time** it is injected or resolved.

```ts
app.addTransientScope(HelperSymbol, UtilityService)
```

Use when the class is stateless or should not be reused:

* Pure utility functions
* One-off processors (e.g., PasswordHasher, TokenEncoder)

### setDotEnv()

Loads environment variables from `process.env` and registers an Env service into the DI container.
Make sure to load your environment variables (e.g. using dotenv.config()) before calling `setDotEnv()`. The Env service reads from `process.env` at the time it's registered.

```ts
app.setDotEnv()
```

After that, you can inject the Env using the `IEnvSymbol` token:

```ts
constructor(@Inject(IEnvSymbol) private env: IEnv) {}

this.env.get("PORT");
```

### setLogger(logger: ILogger)

Replaces the default logger with your own custom implementation.

```ts
app.setLogger(new MyCustomLogger());
```

The default logger is a **basic console-based implementation**.
To integrate with tools like `Winston`, `Pino`, or external logging systems, pass in your own `ILogger` implementation.

After that, you can inject the Logger using the `ILoggerSymbol` token:

```ts
constructor(@Inject(ILoggerSymbol) private logger: ILogger) {}

this.logger.info("hello world!")
```


WIP
