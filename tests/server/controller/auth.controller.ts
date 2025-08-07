import path from "path";
import {
  APP_TOKEN,
  Controller,
  FromBody,
  FromMultipart,
  FromParam,
  Get,
  Guard,
  Inject,
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
import { UploadFile, UploadFileSchema } from "../contract/auth/uploadfile";
import { JwTokenHelper } from "../../../packages/utils/jwt";
import { JWT_TOKEN } from "../jwt";
import {
  LoginBody,
  LoginBodySchema,
  LoginRes,
  LoginResSchema,
} from "../contract/auth/login";

// @Guard("none")
@Controller("/auth")
export class AuthController {
  constructor(@Inject(JWT_TOKEN) private jwt: JwTokenHelper) {}

  @Guard("none")
  @Schema({
    tags: ["Auth"],
    description: "login",
    body: LoginBodySchema,
    response: {
      [Status.OK]: LoginResSchema,
    },
  })
  @Post("/login")
  async login(@FromBody() body: LoginBody) {
    const { account, password } = body;
    const token = this.jwt.generateToken({
      account,
    });
    return Responses.OK<LoginRes>({ token });
  }

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

  @Schema({
    tags: ["Auth"],
    description: "upload file",
    body: UploadFileSchema,
  })
  @Post("/file")
  @UseMultipart()
  async uploadFile(@FromMultipart() multi: UploadFile, @FromBody() body: any) {
    const { userId, photo, photos } = multi;
    console.log(userId);
    console.log(photo);
    console.log(photos);
    console.log(body);
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
