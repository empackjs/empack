import { IEnv } from "./interfaces";

export class Env<T> implements IEnv<T> {
  #env = process.env;

  get(key: keyof T): string {
    const value = this.#env[key.toString()];
    if (!value) {
      throw new Error(`Environment variable ${key.toString()} is not defined`);
    }
    return value;
  }

  getOptional(key: keyof T): string | undefined {
    return this.#env[key.toString()];
  }
}
