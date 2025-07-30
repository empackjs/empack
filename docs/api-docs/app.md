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

## createBuilder(configure?: (options: AppOptions) => void)

The `createBuilder()` method is the entry point for creating an Empack application. It returns a new App instance and allows you to configure global settings before the server starts.

```ts
const app = App.createBuilder(opt: AppOptions => {
    //options
})
```

### AppOptions

The `AppOptions` object allows you to customize global application settings.

| Option         | Type     |Default Value| Description                           |
|----------------|----------|-------------|---------------------------------------|
| `routerPrefix` |`string`  |`/api`       | Global prefix for all API routes.     |
| `wsPrefix`     |`string`  |`""`         | Global prefix for all websocket routes|
| `setTimeout`   |`number?` |`undefined`  | Custom timeout for HTTP server.       |

## addSingleton(token: symbol, constructor: Newable)

Registers a dependency in singleton scope, meaning it will be created only **once** and reused across the entire application lifecycle.  

```ts
const LOGGER = Symbol("Logger");

class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

app.addSingleton(LOGGER, LoggerService)
```

Use this for services or resources that should be **shared globally**, such as:
* Logger
* Database connections
* Configuration services

## addConstant(token: symbol, instance: any)

Registers a pre-instantiated object or value into the DI container. This value will be injected **as Singleton**.

```ts
const CONFIG = Symbol("Config");

const config = {
  baseUrl: "https://api.example.com",
  debug: true,
};

app.addConstant(CONFIG, config);
```

## setDotEnv()

Loads environment variables from `process.env` and registers an Env service into the DI container.
Make sure to load your environment variables (e.g. using dotenv.config()) before calling `setDotEnv()`. The Env service reads from `process.env` at the time it's registered.

```ts
app.setDotEnv()
```

After that, you can inject the Env using the `APP_TOKEN.IEnv`:

```ts
constructor(@Inject(APP_TOKEN.IEnv) private env: IEnv) {}

this.env.get("PORT");
```

## setLogger(logger: ILogger)

Replaces the default logger with your own custom implementation.

```ts
app.setLogger(new MyCustomLogger());
```

The default logger is a **basic console-based implementation**.
To integrate with tools like `Winston`, `Pino`, or external logging systems, pass in your own `ILogger` implementation.

After that, you can inject the Logger using the `APP_TOKEN.ILogger` token:

```ts
constructor(@Inject(APP_TOKEN.ILogger) private logger: ILogger) {}

this.logger.info("hello world!")
```


## WIP
