import { MediatedRequest } from "@empackjs/core";
import { RegisterError, RegisterResult } from "./register.result";
import { OneOf } from "@empackjs/utils";

export class RegisterCommand extends MediatedRequest<
  OneOf<RegisterResult, RegisterError>
> {
  readonly account: string;
  readonly password: string;
  readonly username: string;

  constructor(props: { account: string; password: string; username: string }) {
    super();
    this.account = props.account;
    this.password = props.password;
    this.username = props.username;
  }
}
