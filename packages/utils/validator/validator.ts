import {
  ValidationChain,
  ValidationError,
  ValidationFailResponse,
  validationResult,
} from ".";
import {
  EmpackMiddlewareFunction,
  NextFunction,
  Request,
  Response,
} from "../../core";

export function createRule<T>(
  handler: (key: <K extends keyof T>(k: K) => K) => ValidationChain[],
): ValidationChain[] {
  return handler((k) => k);
}

export function validate<T = any>(
  chains: ValidationChain[],
  handler?: (errors: ValidationError[]) => ValidationFailResponse<T>,
): EmpackMiddlewareFunction {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const chain of chains) {
      await chain.run(req);
    }
    const errs = validationResult(req);
    if (!errs.isEmpty()) {
      let status: number | undefined = undefined;
      let data: any = undefined;
      if (handler) {
        const result = handler(errs.array());
        status = result.status;
        data = result.data;
      }
      res.status(status ?? 400).json(data ?? errs.array().map((x) => x.msg));
      return;
    }
    next();
  };
}
