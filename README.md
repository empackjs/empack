# Empack

An Express-based web server framework.

## Description

Empack is an Express-based web server framework that integrates common utilities for building backend applications.  

It comes with a built-in dependency injection container powered by [Inversify](https://github.com/inversify/InversifyJS), and promotes the use of the *CQRS pattern* in web development. 

Empack also introduces an error-handling model inspired by Rust, encouraging developers to handle errors explicitly using result types instead of relying on `throw` statements.

The framework is designed to provide a safe and lightweight development experience.

## Installation

```bash
npm i @empackjs/core
```

## Usage

Empack currently supports `TypeScript only` as the programming language.
To enable decorator support and metadata reflection, make sure to include the following options in your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```
