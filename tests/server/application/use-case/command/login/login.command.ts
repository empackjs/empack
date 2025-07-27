import { MediatedRequest } from "@empackjs/core";
import { LoginError, LoginResult } from "./login.result";
import { OneOf } from "@empackjs/utils";

export class LoginCommand extends MediatedRequest<OneOf<LoginResult, LoginError>> {
  readonly account: string;
  readonly password: string;

  constructor(props: { account: string; password: string }) {
    super();
    this.account = props.account;
    this.password = props.password;
  }
}
