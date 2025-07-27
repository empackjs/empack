import { MediatedRequest, OneOf } from "../../../../../../packages/core";
import { LoginError, LoginResult } from "./login.result";

export class LoginCommand extends MediatedRequest<OneOf<LoginResult, LoginError>> {
  readonly account: string;
  readonly password: string;

  constructor(props: { account: string; password: string }) {
    super();
    this.account = props.account;
    this.password = props.password;
  }
}
