# Mediator Pattern (CQRS)

Empack includes a built-in Mediator Pattern system, ideal for decoupling business logic via requests, commands, and event handlers. It promotes a clean, testable, and organized application structure.
Inspired by libraries like `MediatR (.NET)` and `nestjs/cqrs`.

## Why Use Mediator?

* ❌ No more business logic inside controllers
* ✅ Logic is testable in isolation
* ✅ Promotes CQRS architecture
* ✅ Scales well for large applications
* ✅ Easier to apply cross-cutting concerns (logs, auth, validation)

## Registering Handlers

You can register mediator handlers globally using:

```ts
app.setMediator([
  RegisterHandler,
  LoginHandler,
  SendEmailHandler,
]);
```

Each handler must be decorated with:

```ts
@HandleFor(RegisterCommand)
export class RegisterHandler implements IReqHandler<RegisterCommand, RegisterResult> {
  async handle(command: RegisterCommand): Promise<...> {
    ...
  }
}

or

@Subscribe(UserRegisteredEvent)
export class SendWelcomeEmail implements IEventHandler<UserRegisteredEvent> {
  async handle(event: UserRegisteredEvent) {
    ...
  }
}
```

## Dispatching Requests in Controller

Extend your controller from `MediatedController` to gain `dispatch(...)` method:

```ts
@Controller("/auth")
export class AuthController extends MediatedController {
  @Post("/register")
  async register(@FromBody() body: RegisterReq) {
    const command = new RegisterCommand(body);
    const result = await this.dispatch(command);
    ...
  }
}
```

## Request Classes

All commands or queries recommend to extend `MediatedRequest<TResult>` for better type assert:

```ts
export class RegisterCommand extends MediatedRequest<RegisterResult> {
  constructor(public readonly data: RegisterReq) {
    super();
  }
}
```

This allows strong typing between request and response.

## Publishing Events

To broadcast events to multiple subscribers, use the `IPublisher`:

```ts
class SomeService {
  constructor(@inject(APP_TOKEN.IPublisher) private readonly pulisher: IPublisher) {}

  async someLogic() {
    ...
    await this.pulisher.publish(new SomethingHappenedEvent(...));
  }
}
```

### Creating an Event

Unlike requests, events don’t require a base class, but you can define a class for type safety:

```ts
class UserRegisteredEvent {
  constructor(public readonly userId: string) {}
}
```

### Subscribing to Events

Use `@Subscribe(...)` to register event listeners:

```ts
@Subscribe(UserRegisteredEvent)
export class SendWelcomeEmail implements IEventHandler<UserRegisteredEvent> {
  constructor(@inject(APP_TOKEN.ILogger) private logger: ILogger) {}

  async handle(event: UserRegisteredEvent) {
    // send email
  }
}
```

## Request vs Event

| Type    | Base Class           | Handler Decorator | Description                     |
| ------- | -------------------- | ----------------- | ------------------------------- |
| Request | `MediatedRequest<T>` | `@HandleFor(...)` | 1:1 request-response (commands) |
| Event   | `any`                | `@Subscribe(...)` | 1\:N event broadcasting         |

## Pipeline Support (Middleware)

Empack supports **pre** and **post** pipelines for cross-cutting logic (e.g., logging, validation, auth).

```ts
app.setMediator([SomeHandler], {
  pre: [LoggingPipe],
  post: [AuditPipe],
});
```

Each pipe is a class that extends:

```ts
@injectable()
export class LoggingPipe extends MediatorPipe {
  async handle(req, next) {
    console.log("Incoming:", req);
    return next(req);
  }
}
```

Pre pipes run before the handler, post pipes run after.
