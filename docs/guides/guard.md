# Guard

Guard in Empack are specialized middleware designed for **authentication**, **authorization**, or any **access control logic**.
They are fully integrated with the DI container and can be applied globally, per-controller, or per-route.

## What is a Guard?

A guard is a middleware that runs **first** and decides whether to allow or block the request.
Common use cases include:

* Verifying JWT tokens
* Checking user roles
* Blocking unauthenticated access to protected routes

Since guards can be a class-based middleware, they support full Dependency Injection.

```ts
export class JwtGuard implements GuardMiddleware {
  constructor(private user: CurrentUser) {}

  async use(req: FastifyRequest) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return Responses.ClientError.Unauthorized({ message: "Unauthorized" })

    try {
      const payload = jwt.verify(token, "secret");
      this.user.id = payload.sub;
      next();
    } catch {
      return Responses.ClientError.Unauthorized({ message: "Invalid Token" })
    }
  }
}
```

## Enabling Auth Guard

To activate the guard system, use:

```ts
app.enableAuthGuard(JwtGuard);
```

Once enabled, all routes require a guard by default. If a route or controller does not specify one, the default will be used.

## Making Routes Public

You can skip guard checks by marking routes or controllers with:

```ts
@Guard("none")
@Get("/public")
getPublic() {
  return Responses.OK("Anyone can access this.");
}
```

>[!NOTE]
`"none"` means no guard will be applied at all, making the route publicly accessible.

## Overriding Guards

You can override the default guard at the **controller** or **route** level:

```ts
@Guard(AdminGuard)
@Controller("/admin")
export class AdminController {
  @Get("/")
  getDashboard() {
    return Responses.OK("Admin Only");
  }

  @Guard("none")
  @Get("/status")
  getStatus() {
    return Responses.OK("Public route inside AdminController");
  }
}
```

## Execution Order

When using guards, Empack applies middleware in the following order:

```
Guard middleware (default or custom)
        ↓
App-level middleware (app.useMiddleware(...))
        ↓
Controller-level middleware
        ↓
Route-level middleware
        ↓
Route handler
```

>[!TIP]
Avoid throwing exceptions inside guard classes unless you want them to be handled by the global ExceptionHandler.
Prefer returning proper HTTP responses like `Responses.ClientError.Unauthorized(...)`.
