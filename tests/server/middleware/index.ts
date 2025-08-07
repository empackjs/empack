import {
  APP_TOKEN,
  FastifyRequest,
  IEmpackMiddleware,
  IEnv,
  ILogger,
  Inject,
  Responses,
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
    console.log("Before delay");
    await delay(1000);
    console.log("After delay");
  }
}

export class ReplyTestMiddleware implements IEmpackMiddleware {
  constructor(@Inject(APP_TOKEN.ILogger) private logger: ILogger) {}

  async use() {
    console.log("stop test");
    return Responses.ClientError.Forbidden("stop test");
  }
}
