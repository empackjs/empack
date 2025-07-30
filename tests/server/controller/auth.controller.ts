import { LoginCommand } from "../application/use-case/command/login/login.command";
import { LoginReq, LoginRule } from "../contract/auth/login";
import { ErrorBody } from "./error-body";
import { ErrorCodes } from "../application/error-codes";
import {
  RegisterReq,
  RegisterRes,
  RegisterRule,
} from "../contract/auth/register";
import { RegisterCommand } from "../application/use-case/command/register/register.command";
import { UploadFile } from "../contract/auth/file";
import { GetIdParams, GetIdQuery, GetIdRes } from "../contract/auth/getId";
import {
  ApiDoc,
  Controller,
  FromBody,
  FromMultipart,
  FromParam,
  FromQuery,
  Get,
  Guard,
  MediatedController,
  Post,
  Responses,
  UseMultipart,
} from "@empackjs/core";
import { matchResult, Track, validate } from "@empackjs/utils";
import { AsyncTestMiddleware } from "../middleware";
import { UserService } from "../service";

@Track()
@Guard("none")
@Controller("/auth")
export class AuthController extends MediatedController {
  constructor(
    private _userSvc: UserService,
  ) {
    super();
  }

  @ApiDoc({
    summary: "會員註冊",
    description: "會員註冊詳細說明",
    tags: ["Auth"],
    requestBody: "auto",
    responses: {
      201: { description: "回傳內容", content: RegisterRes },
      409: { description: "錯誤訊息", content: ErrorBody },
    },
  })
  @Post("/register", validate(RegisterRule))
  async register(@FromBody() req: RegisterReq) {
    const a = this._userSvc.get()
    console.log("Controller", a)

    const command = new RegisterCommand(req);
    const result = await this.dispatch(command);
    return matchResult(result, {
      ok: (v) => {
        return Responses.Created<RegisterRes>({
          account: v.account,
          username: v.username,
        });
      },
      err: {
        [ErrorCodes.USER_ALREADY_EXISTS]: (e) => {
          return Responses.Conflict<ErrorBody>({
            errorCode: e,
          });
        },
      },
    });
  }

  @Post("/login", validate(LoginRule))
  async login(@FromBody() req: LoginReq) {
    const command = new LoginCommand(req);
    const result = await this.dispatch(command);
    return matchResult(result, {
      ok: (v) => {
        return Responses.OK({
          accessToken: v.accessToken,
        }).with({
          cookies: [
            {
              key: "refresh_token",
              value: v.refreshToken,
              options: {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 60 * 60 * 24 * 30, // 30days
              },
            },
          ],
        });
      },
      err: {
        [ErrorCodes.ACCOUNT_OR_PASSWORD_INCORRECT]: (e) => {
          return Responses.Unauthorized<ErrorBody>({
            errorCode: e,
          });
        },
      },
    });
  }

  @ApiDoc({
    tags: ["Auth"],
    params: "auto",
    query: "auto",
    responses: {
      200: {
        content: GetIdRes,
      },
    },
  })
  @Get("/server/:serverId/room/:roomId")
  async getId(
    @FromQuery() query: GetIdQuery,
    @FromParam() params: GetIdParams,
  ) {
    const { roomId, serverId } = params;
    const { token, username } = query;
    return Responses.OK<GetIdRes>({
      roomId,
      serverId,
      token,
      username,
    });
  }

  @Get("/empty", AsyncTestMiddleware)
  async empty() {}

  @Post("/error", AsyncTestMiddleware)
  async error() {
    throw new Error("error test");
  }

  @ApiDoc({
    tags: ["Auth"],
    responses: {
      200: { description: "return a file", content: "binary" },
    },
  })
  @Get("/file")
  async getFile() {
    return Responses.File("test.txt", `tests/assets/test.txt`);
  }

  @ApiDoc({
    tags: ["Auth"],
    contentType: "multipart/form-data",
    requestBody: "auto",
  })
  @UseMultipart({
    type: "array",
    name: "photos",
  })
  @Post("/file")
  async postFile(@FromMultipart(["photos"]) multi: UploadFile) {
    console.log(multi);
    return Responses.OK({ title: multi.title });
  }
}
