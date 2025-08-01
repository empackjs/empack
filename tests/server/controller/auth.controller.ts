import path from "path";
import {
  Controller,
  FromBody,
  FromMultipart,
  FromParam,
  Get,
  Guard,
  Post,
  Responses,
  Schema,
  Status,
  UseMultipart,
} from "../../../packages/core";
import {
  RegisterBody,
  RegisterBodySchema,
  RegisterResSchema,
  RegisterRes,
} from "../contract/auth/register";
import { AsyncTestMiddleware, ReplyTestMiddleware } from "../middleware";

@Guard("none")
@Controller("/auth")
export class AuthController {
  @Schema({
    tags: ["Auth"],
    description: "會員註冊",
    body: RegisterBodySchema,
    response: {
      [Status.OK]: RegisterResSchema,
    },
  })
  @Post("/register/:id", AsyncTestMiddleware, ReplyTestMiddleware)
  async register(@FromBody() body: RegisterBody, @FromParam("id") id: string) {
    console.log(id);
    const { username, account } = body;
    return Responses.OK<RegisterRes>({
      account,
      username: username ?? "",
    });
  }

  @Post("/file")
  @UseMultipart()
  async file(@FromMultipart() multi: any) {
    console.log(multi);
    return Responses.OK("ok");
  }

  @Get("/file")
  async getFile() {
    return Responses.File(
      "yourFile.txt",
      path.join(process.cwd(), "assets/test.txt"),
    );
  }
}
