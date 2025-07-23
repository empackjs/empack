import { inject } from "../../../../../../src/di";
import { HandleFor } from "../../../../../../src/mediator";
import { ErrorReturn, OkReturn, OneOf } from "../../../../../../src/result";
import { TrackClassMethods, uuid } from "../../../../../../src/utils";
import { UserRepository } from "../../../../infra/repository/user.repository";
import { ErrorCodes } from "../../../error-codes";
import { IUserRepository } from "../../../persistence/user.repository";
import { RegisterCommand } from "./register.command";
import { RegisterError, RegisterResult } from "./register.result";
import {
  ScopeTest,
  ScopeTestSymbol,
  UserRoot,
} from "../../../../domain/user/user.root";
import { IReqHandler } from "../../../../../../src/mediator/mediator";

@HandleFor(RegisterCommand)
@TrackClassMethods()
export class RegisterHandler
  implements IReqHandler<RegisterCommand, OneOf<RegisterResult, RegisterError>>
{
  constructor(
    @inject(UserRepository) private readonly _userRepository: IUserRepository,
    @inject(ScopeTestSymbol) private readonly _scopeTest: ScopeTest,
  ) {}

  async handle(
    req: RegisterCommand,
  ): Promise<OneOf<RegisterResult, RegisterError>> {
    console.log("after mediator: ", this._scopeTest.index);

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
