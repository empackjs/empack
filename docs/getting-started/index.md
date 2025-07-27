# Getting Started

Start by installing `empack` and `reflect-metadata`

```sh
npm install @empackjs/core reflect-metadata
```

Then make sure you have `experimentalDecorators` and `emitDecoratorMetadata` set to true in your `tsconfig.json`

```json
//tsconfig.json
"compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
}
```
