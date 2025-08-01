import {
  APP_TOKEN,
  EmpackMiddlewareFunction,
  IEmpackMiddleware,
  ILogger,
  Inject,
  NextFunction,
  Request,
  Response,
} from "@empackjs/core";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AsyncTestMiddleware implements IEmpackMiddleware {
  constructor(@Inject(APP_TOKEN.ILogger) private logger: ILogger) {}
  async use(_req: Request, _res: Response, next: NextFunction): Promise<void> {
    this.logger.debug("Middleware start");
    await delay(1000);
    this.logger.debug("Middleware end");
    next();
  }
}

export const rateLimiter: EmpackMiddlewareFunction = (_req, _res, next) => {
  return next(new Error("Too many requests"));
};
