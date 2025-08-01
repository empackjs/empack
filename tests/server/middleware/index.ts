import { FastifyReply, FastifyRequest, IEmpackMiddleware } from "../../../packages/core";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AsyncTestMiddleware implements IEmpackMiddleware {
  async use(_req: FastifyRequest, _reply: FastifyReply,): Promise<void> {
    console.log("start")
    await delay(1000);
    console.log("end")
  }
}

// export const rateLimiter: EmpackMiddlewareFunction = (_req, _res, next) => {
//   return next(new Error("Too many requests"));
// };
