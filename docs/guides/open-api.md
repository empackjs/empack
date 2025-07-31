# OpenAPI

Empack provides first-class OpenAPI documentation via the `@ApiDoc()`, `@ApiProperty`, `@ApiArrayProperty` decorator and runtime type reflection. 
It allows you to describe your API endpoints in a structured way, generate Swagger UI, and keep your schema up to date with minimal boilerplate.

## Enabling Swagger

To enable OpenAPI, register the Swagger module:

```ts
app.enableSwagger({
  title: "My App",
  version: "1.0.0",
  description: "Auto-generated Swagger UI for Empack APIs",
});
```

Then swagger server start at `localhost:3000/docs` by default.

## Describe Endpoint

Use `@ApiDoc()` to define metadata for a specific route handler.

```ts
@ApiDoc({
  summary: "User Registration",
  description: "Register a new user into the system",
  tags: ["Auth"],
  requestBody: "auto",
  responses: {
    [Status.OK]: { description: "Success", content: RegisterRes }, // use Status enum
    409: { description: "Conflict", content: ErrorBody }, // or simply use status codes
  },
})
@Post("/register")
async register(@FromBody() req: RegisterReq) {
  // ...
}
```

### `@ApiDoc` Options

| Option             | Type                                            | Description                                          |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| `summary`          | `string`                                        | Short title of the endpoint                          |
| `description`      | `string`                                        | Detailed explanation                                 |
| `tags`             | `string[]`                                      | Used for grouping routes in Swagger UI               |
| `contentType`      | `"application/json"` \| `"multipart/form-data"` | Request type (automatically inferred in most cases)  |
| `requestBody`      | `"auto"` \| `Newable` \| `[Newable]`            | The request body schema                              |
| `params` / `query` | `"auto"` \| `Newable` \| array                  | Optional: manually define path/query parameter types |
| `responses`        | `Record<number, ResContent>`                    | Define status code responses and schema output       |

## Describe Fields in a Class

Apply `@ApiProperty()` to a field inside a class to define its schema for OpenAPI documentation.

```ts
export class RegisterRes {
  @ApiProperty({ description: "Account ID", example: "john.doe" })
  account!: string;

  @ApiProperty({ description: "Username", example: "John Doe" })
  username!: string;
}
```

### `@ApiProperty` Options

| Option        | Description                                     |
| ------------- | ----------------------------------------------- |
| `description` | Short description of the field                  |
| `format`      | OpenAPI format, e.g., `"email"`, `"uuid"`, etc. |
| `example`     | Example value to show in Swagger UI             |
| `required`    | Mark the field as required (default: `false`)    |

## Describe Arrays

Use `@ApiArrayProperty()` for fields that are arrays, especially when the array contains nested objects or file uploads.

```ts
export class Address {
  @ApiProperty({ description: "Country" })
  country!: string;

  @ApiProperty({ description: "District" })
  district!: string;
}

export class RegisterReq {
  @ApiProperty({ description: "Username" })
  username!: string;

  @ApiArrayProperty({
    description: "User addresses",
    type: Address,
  })
  address!: Address[];
}
```

For file uploads:

```ts
export class UploadFile {
  @ApiProperty({ description: "Title" })
  title!: string;

  @ApiArrayProperty({
    description: "Files",
    type: "string",
    format: "binary",
  })
  photos!: MulterFile[];
}
```

### `@ApiArrayProperty` Options

| Option        | Description                                        |
| ------------- | -------------------------------------------------- |
| `type`        | Either a class or `"string"`, `"number"`, etc.     |
| `format`      | Optional format (e.g., `"binary"` for file upload) |
| `description` | Human-friendly description                         |
| `example`     | Example array content                              |
| `required`    | Whether this field is required in the request      |

## Notes

### 1. `@ApiProperty` / `@ApiArrayProperty` limitation

* These decorators must be used on class declarations.
* They do not work with type aliases or interface, because those constructs are erased at runtime and cannot be introspected by decorators.
* If you attempt to use them outside a class, they will be ignored in OpenAPI generation.

### 2. Multipart Support & Schema Generation

* When using `multipart/form-data`, Empack will generate OpenAPI request schemas based on the class decorated with `@ApiProperty` and `@ApiArrayProperty`.
* If you want to take full advantage of `"requestBody: 'auto'"` behavior for file uploads. Use `@FromMultipart()` to receive the uploaded data.

```ts
class UploadFile {
  @ApiProperty({
    description: "title",
  })
  title!: string;

  @ApiArrayProperty({
    description: "photos",
    type: "string",
    format: "binary",
  })
  photos!: MulterFile[];
}

@ApiDoc({
  contentType: "multipart/form-data",
  requestBody: "auto",
})
@UseMultipart({
  type: "array",
  name: "photos",
})
@Post("/upload")
async upload(@FromMultipart(["photos"]) input: UploadFile) {
  // input.title, input.photos available here
}
```

* This ensures Empack can bind your multipart data to a class and generate a valid schema in the OpenAPI spec.

