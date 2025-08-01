import {
  APP_TOKEN,
  FastifyReply,
  FastifyRequest,
  IEmpackMiddleware,
  IEnv,
  ILogger,
  Inject,
} from "../../../packages/core";
import { Env } from "../main";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class AsyncTestMiddleware implements IEmpackMiddleware {
  constructor(
    @Inject(APP_TOKEN.ILogger) private logger: ILogger,
    @Inject(APP_TOKEN.IEnv) private env: IEnv<Env>,
  ) {}

  async use() {
    const path = this.env.get("DOWNLOAD_PATH");
    console.log(path);
    this.logger.debug("Before delay");
    await delay(1000);
    this.logger.debug("After delay");
  }
}

export class ReplyTestMiddleware implements IEmpackMiddleware {
  constructor(@Inject(APP_TOKEN.ILogger) private logger: ILogger) {}

  async use(_req: FastifyRequest, reply: FastifyReply) {
    this.logger.debug("stop test");
    reply.status(400).send("stop test");
  }
}
