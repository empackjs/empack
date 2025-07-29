import {
  IEventHandler,
  ILogger,
  inject,
  Subscribe,
  TOKEN,
} from "@empackjs/core";
import { LoginFailedEvent } from "../use-case/command/login/events/loginFailed.event";

@Subscribe(LoginFailedEvent)
export class SendEmail implements IEventHandler<LoginFailedEvent> {
  constructor(@inject(TOKEN.ILogger) private logger: ILogger) {}
  async handle(event: LoginFailedEvent): Promise<void> {
    this.logger.debug(
      `account:${event.account} login failed, email handler executed`,
    );
  }
}
