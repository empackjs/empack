import { injectable as __injectable } from "inversify";

export function injectable(name?: "request" | "transient"): ClassDecorator {
  return (target: any) => {
    return name === "request"
      ? __injectable("Singleton")(target)
      : __injectable("Transient")(target);
  };
}
