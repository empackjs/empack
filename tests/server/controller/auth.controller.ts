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
import { UploadFile, UploadFileSchema } from "../contract/auth/uploadfile";

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
