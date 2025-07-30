import { injectable } from "@empackjs/core";

@injectable("request")
export class UserService {
  index = 1;

  get() {
    return this.index++;
  }
}
