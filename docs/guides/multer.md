# Multer

Empack provides first-class integration with [Multer](https://github.com/expressjs/multer) to handle file uploads via a simple decorator-based API.
Instead of registering multer manually for each route, you can simply use the `@UseMultipart()` decorator to enable upload support on any controller method.

## Basic Usage

### 1. Handle single file upload

```ts
@Post("/upload")
@UseMultipart({
  type: "single",
  name: "avatar",
})
uploadAvatar(@FromFile() file: MulterFile) {
  return Responses.OK(`Uploaded: ${file.originalname}`);
}
```

### 2. Handle multiple files (array)

```ts
@Post("/images")
@UseMultipart({
  type: "array",
  name: "photos",
  maxCount: 5,
})
uploadImages(@FromFiles() files: MulterFile[]) {
  return Responses.OK(`Uploaded ${files.length} files.`);
}
```

### 3. Handle multiple fields

```ts
@Post("/form")
@UseMultipart({
  type: "fields",
  fields: [
    { name: "avatar", maxCount: 1 },
    { name: "documents", maxCount: 3 },
  ],
})
uploadForm(
    @FromFiles("avatar") avatar: MulterFile[], 
    @FromFiles("documents") documents: MulterFile[]
) {
  return Responses.OK({ avatar: files.avatar?.[0], documents: files.documents });
}
```

### 4. Disable file upload parsing

```ts
@Post("/text")
@UseMultipart({ type: "none" })
handleTextOnly(req, res) {
  return Responses.OK("No file expected.");
}
```

## Default Behavior and Overrides

You can define global default Multer options using:

```ts
app.setMulterDefaults({
  storage: "memory",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
```

These defaults will be applied to all routes unless overridden.
If a route is decorated with `@UseMultipart(...)`, its options will override the defaults for that specific route only.

>[!TIP]
Global defaults are ideal for consistent config (e.g. always use memory storage),
while per-route overrides give you flexibility when needed.
