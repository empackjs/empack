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
import { ScopeTest, ScopeTestSymbol } from "../domain/user/user.root";
import { AsyncTestMiddleware } from "../middleware";
import { UploadFile } from "../contract/auth/file";
import { GetIdParams, GetIdQuery, GetIdRes } from "../contract/auth/getId";
import { ApiDoc, Controller, createMulter, FromBody, FromParam, FromQuery, Get, Guard, inject, MediatedController, Multipart, Post, Responses, uploader } from "@empackjs/core";
import { matchResult, Track, validate } from "@empackjs/utils";

const storage: uploader.DiskStorageOptions = {
  destination: `${process.cwd()}/tests/upload_test/`,
};

const multer = createMulter(storage);

@Track()
@Guard("none")
@Controller("/auth")
export class AuthController extends MediatedController {
  constructor(@inject(ScopeTestSymbol) private readonly _scopeTest: ScopeTest) {
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
    console.log("from controller: ", this._scopeTest.index);
    this._scopeTest.index++;
    console.log("and add one in controller: ", this._scopeTest.index);

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

  @Get("/empty", AsyncTestMiddleware, (_req, _res, next) => {
    console.log("sync function");
    next();
  })
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
  @Post("/file", multer.array("photos"))
  async postFile(@Multipart(["photos"]) multi: UploadFile) {
    console.log(multi);
    return Responses.OK({ title: multi.title });
  }
}
