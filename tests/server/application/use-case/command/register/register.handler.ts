import { UserRepository } from "../../../../infra/repository/user.repository";
import { ErrorCodes } from "../../../error-codes";
import { RegisterCommand } from "./register.command";
import { RegisterError, RegisterResult } from "./register.result";
import { UserRoot } from "../../../../domain/user/user.root";
import { ErrorReturn, OkReturn, OneOf, Track, uuid } from "@empackjs/utils";
import { HandleFor, Inject, IReqHandler } from "@empackjs/core";
import { IUserRepository } from "../../../persistence/user.repository";
import { UserService } from "../../../../service";

@Track()
@HandleFor(RegisterCommand)
export class RegisterHandler
  implements IReqHandler<RegisterCommand, OneOf<RegisterResult, RegisterError>>
{
  constructor(
    @Inject(UserRepository) private _userRepository: IUserRepository,
    private _userSvc: UserService
  ) {}

  async handle(
    req: RegisterCommand,
  ): Promise<OneOf<RegisterResult, RegisterError>> {
    const b = this._userSvc.get();
    console.log("Handler", b)

    const isUserExist =
      (await this._userRepository.getByAccount(req.account)) !== null;
    if (isUserExist) {
      return new ErrorReturn(ErrorCodes.USER_ALREADY_EXISTS);
    }
    const userRoot = UserRoot.create({
      id: uuid(),
      account: req.account,
      password: req.password,
      username: req.username,
    });
    const user = await this._userRepository.create(userRoot);
    return new OkReturn({
      account: user.account,
      username: user.username,
    });
  }
}
