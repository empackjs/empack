import {
    APP_TOKEN,
  EmpackMiddlewareFunction,
  IEmpackMiddleware,
  ILogger,
  inject,
} from "@empackjs/core";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AsyncTestMiddleware implements IEmpackMiddleware {
  constructor(@inject(APP_TOKEN.ILogger) private logger: ILogger) {}

  use(): EmpackMiddlewareFunction {
    return async (_req, _res, next) => {
      this.logger.debug("Middleware start");
      await delay(1000);
      this.logger.debug("Middleware end");
      next();
    };
  }
}

export const rateLimiter: EmpackMiddlewareFunction = (_req, _res, next) => {
  return next(new Error("Too many requests"));
};
