# Multer

Empack provides first-class integration with [@fastify/multipart](https://github.com/fastify/fastify-multipart) to handle file uploads via a simple decorator-based API.
Instead of registering multer manually for each route, you can simply use the `@UseMultipart()` decorator to enable upload support on any controller method.

## Basic Usage

### 1. Handle single file upload

```ts
@Post("/upload")
@UseMultipart()
uploadAvatar(@FromFile() file: FilePart) {
  return Responses.OK(`Uploaded: ${file.originalname}`);
}
```

### 2. Handle multiple files (array)

```ts
@Post("/images")
@UseMultipart()
uploadImages(@FromFiles() files: FilePart[]) {
  return Responses.OK(`Uploaded ${files.length} files.`);
}
```

## Default Behavior and Overrides

You can define global default Multer options using:

```ts
app.setMulterDefaults({
  limits?: {
    fileSize?: number;
    files?: number;
  };
});
```

These defaults will be applied to all routes unless overridden.
If a route is decorated with `@UseMultipart(...)`, its options will override the defaults for that specific route only.

## About `@UseMultipart()` and `@FromMultipart()`

The `@UseMultipart()` decorator configures the Multer middleware for parsing `multipart/form-data` in a route.

The `@FromMultipart()` decorator then allows you to inject a combined object that includes:

* All text fields (`req.body`)
* The uploaded files specified in `@UseMultipart()`, merged by their field names

>[!NOTE]
This means `@FromMultipart()` gives you a complete view of both form fields and uploaded files in one object.

### Example

```ts
@Post("/profile")
@UseMultipart()
updateProfile(
  @FromMultipart() body: {
    username: string;
    avatar?: FilePart;
    documents?: FilePart[];
  },
) {
  return Responses.OK(body);
}
```

This will result in an injected object like:

```json
{
  username: "Alice",
  avatar: { filename: "pic.png", ... },
  documents: [{ filename: "doc1.pdf", ... }, { filename: "doc2.pdf", ... }]
}
```
