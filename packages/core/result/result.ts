import { ErrorResult, OkResult, OneOf } from "./types";

export class ErrorReturn<E> implements ErrorResult<E> {
  isSuccess: false;
  error: E;

  constructor(err: E) {
    this.isSuccess = false;
    this.error = err;
  }
}

export class OkReturn<T> implements OkResult<T> {
  isSuccess: true;
  data: T;

  constructor(data: T) {
    this.isSuccess = true;
    this.data = data;
  }
}

export const matchResult = <T, E extends string | number | symbol, R>(
  result: OneOf<T, E>,
  handlers: {
    ok: (value: T) => R;
    err: Record<E, (error: E) => R>;
  },
): R => {
  if (result.isSuccess) {
    return handlers.ok(result.data);
  }
  const handler = handlers.err[result.error];
  if (!handler) {
    throw new Error(`Unhandled error case: ${result.error.toString()}`);
  }
  return handler(result.error);
};
