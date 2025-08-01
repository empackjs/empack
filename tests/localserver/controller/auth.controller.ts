import fs from "fs";

import {
  Controller,
  FastifyRequest,
  FromBody,
  FromFiles,
  FromMultipart,
  FromReq,
  Guard,
  MulterFile,
  Post,
  Responses,
  UseMultipart,
} from "../../../packages/core";
import { RegisterReq } from "../../server/contract/auth/register";
import { AsyncTestMiddleware } from "../../server/middleware";
import { pipeline } from "stream/promises";

@Guard("none")
@Controller("/auth")
export class AuthController {
  @Post("/register")
  async register(@FromBody() body: RegisterReq) {
    console.log(body);
    return Responses.OK("ok");
  }

  @Post("/file")
  @UseMultipart()
  async file(@FromMultipart() multi: any) {
    console.log(multi);
    return Responses.OK("ok");
  }
}
