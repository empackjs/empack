import {
  Controller,
  FromBody,
  FromMultipart,
  FromParam,
  Guard,
  Post,
  Responses,
  Schema,
  Status,
  UseMultipart,
} from "../../../packages/core";
import { AsyncTestMiddleware } from "../../server/middleware";
import {
  RegisterReq,
  RegisterBody,
  RegisterOK,
  RegisterRes,
} from "../contract/auth/register";

@Guard("none")
@Controller("/auth")
export class AuthController {
  @Schema({
    description: "會員註冊",
    body: RegisterBody,
    response: {
      [Status.OK]: RegisterOK,
    },
  })
  @Post("/register/:id")
  async register(@FromBody() body: RegisterReq, @FromParam("id") id: number) {
    console.log(id)
    const { username, account } = body;
    return Responses.OK<RegisterRes>({
      account,
      username: username ?? "",
    });
  }

  @Post("/file", AsyncTestMiddleware)
  @UseMultipart()
  async file(@FromMultipart() multi: any) {
    console.log(multi);
    return Responses.OK("ok");
  }
}
