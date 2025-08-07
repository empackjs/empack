# Schema Validation

Empack comes with built-in support for [TypeBox](https://github.com/sinclairzx81/typebox), a powerful library for writing type-safe JSON Schemas using TypeScript.

## Why TypeBox?

TypeBox allows you to define your schemas using familiar TypeScript syntax while automatically generating JSON Schema behind the scenes. 
Empack uses these schemas for request validation at runtime (via [AJV](https://github.com/ajv-validator/ajv)).

Key benefits of TypeBox:

* Fully type-safe and IDE-friendly
* Generates standard JSON Schema
* Seamlessly integrates with Fastify's schema system
* Used for validating body, query, params, and headers

## Basic Example

```ts
import { Type } from '@sinclair/typebox';

export const CreateUserSchema = {
  body: Type.Object({
    username: Type.String({ minLength: 3 }),
    email: Type.String({ format: 'email' }),
    age: Type.Optional(Type.Integer({ minimum: 0 })),
  }),
};
```

You can then attach this schema to your route using the `@Schema()` decorator:

```ts
@Schema({
  body: CreateUserSchema
})
@Post('/')
createUser() {
  // req.body is now fully typed and validated
}
```

Empack automatically validates the incoming request and throws a 400 error if it doesn't match the schema.

## Multipart Support with FileType

Empack provides first-class support for `multipart/form-data` by extending the built-in TypeBox schema system with a custom `FileType()`.

When a route is configured to handle file uploads, the request body is automatically normalized to match the TypeBox schema, 
allowing you to declare file fields just like any other typed property.

```ts
export const UploadFileSchema = Type.Object({
  userId: Type.Number({ description: "User ID" }),
  photo: FileType({ description: "A single photo" }),
  photos: Type.Array(FileType(), { description: "Multiple photos" }),
  addr: Type.Object({
    country: Type.String({ description: "Country" }),
    zip: Type.Number({ description: "ZIP code" }),
  }),
});
```

>[!NOTE]
In multipart form data, all raw field values are originally received as strings.
Empack’s validation uses `AJV` but skips validation on `FileType` fields, because files are handled differently and can’t be directly validated as JSON values.
Instead, Empack attempts to cast string fields to the types defined in your schema, making sure your **non-file fields are properly typed**.
For file uploads, Empack integrates with OpenAPI by converting FileType fields into a **string with format: binary** in the generated Swagger UI schema.
This allows Swagger UI to properly render file input controls that comply with OpenAPI's specification for file uploads.

## Enabling Swagger UI

Empack has built-in support for automatic OpenAPI (Swagger) documentation generation. 
To enable Swagger UI in your app, simply call the `enableSwagger` method with your desired configuration.

```ts
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
```
