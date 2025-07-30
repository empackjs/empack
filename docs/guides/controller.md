# Controller

Empack uses **TypeScript decorators** to define controllers and HTTP routes.
This provides a clear structure for organizing business logic and enables features like automatic OpenAPI documentation and unified response formatting.

## Defining a Controller

Use the `@Controller()` decorator to register a controller and define its base route.
Then, use route decorators such as `@Get` or `@Post` to define individual endpoints.

```ts
import { Controller, Get, Responses } from '@empackjs/core';

@Controller('/hello')
export class HelloController {
  @Get('/')
  sayHi() {
    return Responses.OK({ message: 'Hello, Empack!' })
  }
}
```

Every controller method must return an instance of a `Responses` class, which helps standardize output and includes commonly used HTTP status codes.
If you need to customize the response content or behavior, you can use `JsonResponse` or `FileResponse` for greater control.

Empack currently supports:

* JsonResponse
* FileResponse
* RedirectResponse
* BufferResponse


## Parameter Decorators

Empack provides a rich set of **parameter decorators** that allow you to easily extract data from various parts of the HTTP request.
These decorators can be used in controller methods to access request body, query params, headers, cookies, uploaded files, and more.

| Decorator       | Description                                     |
| --------------- | ----------------------------------------------- |
| `@FromBody()`   | Gets the request body (`req.body`)              |
| `@FromQuery()`  | Gets a query parameter (`req.query`)            |
| `@FromParam()`  | Gets a route parameter (`req.params`)           |
| `@FromLocals()` | Gets a value from `res.locals`                  |
| `@FromReq()`    | Gets the raw Express `Request` object           |
| `@FromRes()`    | Gets the raw Express `Response` object          |
| `@FromFile()`   | Gets a single uploaded file (`req.file`)        |
| `@FromFiles()`  | Gets multiple uploaded files (`req.files`)      |
| `@FromCookie()` | Gets a cookie value (`req.cookies`)             |
| `@FromHeader()` | Gets a specific header (`req.headers`)          |
| `@Multipart()`  | WIP                                             |

```ts
@Get('/user/:userId/book/:bookId')
getUser(
  @FromParam('userId') userId: string,
  @FromParam() params: any, // or for all params
  @FromQuery('expand') expand?: string,
) {
  const { userId, bookId } = params;
  return Responses.OK({userId, bookId});
}
```

To handle file uploads, use `@UseMultipart()` on the route and `@FromFile()` or `@FromFiles()` to access the uploaded content:

```ts
@UseMultipart({
  type: "single",
  name: "photo"
})
@Post("/file")
postFile(@FromFile() photo: MulterFile) {
  return Responses.OK({ title: photo.filename });
}
```

## Registing Controllers

After defining your controllers, you need to register them with the application instance to make their routes active.
In Empack, use the `app.mapController([Controllers])` method to register one or more controllers:

```ts
import { App } from '@empackjs/core';
import { HelloController } from './controllers/hello.controller';

App.createBuilder()
  .mapController([HelloController])
  .run()
```

This step connects all routes defined by the controller decorators to the Express router internally, enabling your endpoints.
