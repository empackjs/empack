import {
  ErrorReturn,
  IJwTokenHelper,
  OkReturn,
  OneOf,
  Track,
} from "@empackjs/utils";
import { AccessTokenSymbol, RefreshTokenSymbol } from "../../../../infra/jwt";
import { UserRepository } from "../../../../infra/repository/user.repository";
import { ErrorCodes } from "../../../error-codes";
import { IUserRepository } from "../../../persistence/user.repository";
import { LoginFailedEvent } from "./events/loginFailed.event";
import { LoginCommand } from "./login.command";
import { LoginError, LoginResult } from "./login.result";
import {
    APP_TOKEN,
  HandleFor,
  Inject,
  IPublisher,
  IReqHandler,
} from "@empackjs/core";

@Track()
@HandleFor(LoginCommand)
export class LoginHandler
  implements IReqHandler<LoginCommand, OneOf<LoginResult, LoginError>>
{
  constructor(
    @Inject(APP_TOKEN.IPublisher) private _publisher: IPublisher,
    @Inject(UserRepository) private _userRepository: IUserRepository,
    @Inject(AccessTokenSymbol)
    private _accessTokenHelper: IJwTokenHelper,
    @Inject(RefreshTokenSymbol)
    private _refreshTokenHelper: IJwTokenHelper,
  ) {}

  async handle(req: LoginCommand): Promise<OneOf<LoginResult, LoginError>> {
    const user = await this._userRepository.getByAccount(req.account);
    if (!user)
      return new ErrorReturn<LoginError>(
        ErrorCodes.ACCOUNT_OR_PASSWORD_INCORRECT,
      );

    const isPasswordCorrect = await user.isPasswordCorrect(req.password);
    if (!isPasswordCorrect) {
      await this._publisher.publish(new LoginFailedEvent(req.account));
      return new ErrorReturn(ErrorCodes.ACCOUNT_OR_PASSWORD_INCORRECT);
    }

    const accessToken = this._accessTokenHelper.generateToken({
      userid: user.id,
      account: user.account,
      username: user.username,
    });

    const refreshToken = this._refreshTokenHelper.generateToken({
      userid: user.id,
    });
    return new OkReturn({
      accessToken,
      refreshToken,
    });
  }
}
