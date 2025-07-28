# Getting Started

> [!NOTE]
Empack is currently designed for TypeScript projects only.  
This guide assumes you're already familiar with basic TypeScript usage.

First, install `@empackjs/core` and `reflect-metadata`:

```sh
npm install @empackjs/core reflect-metadata
```

Next, make sure your `tsconfig.json` has **experimentalDecorators** and **emitDecoratorMetadata** enabled:

```json
//tsconfig.json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
  }
}
```

Set up a minimal API in main.ts:

```ts
//main.ts
import "reflect-metadata";
import { App, Controller, Get, Responses } from "@empackjs/core";

@Controller("/")
class MyController {
  @Get("/hello")
  hello() {
    return Responses.OK("world");
  }
}

App.createBuilder((opt) => {
  opt.routerPrefix = "/api";
})
  .mapController([MyController])
  .run();
```

The server will start at localhost:3000. You can test the API using browser  
http://localhost:3000/api/hello or using curl

```sh
curl -X GET http://localhost:3000/api/hello
# You should receive: "world"
```
