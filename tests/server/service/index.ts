import { Injectable } from "@empackjs/core";

@Injectable("request")
export class UserService {
  index = 1;

  get() {
    return this.index++;
  }
}
