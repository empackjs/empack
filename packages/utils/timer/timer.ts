import { performance } from "node:perf_hooks";
import { AsyncLocalStorage } from "node:async_hooks";
import { TimerHanlder, TimeSpan } from "./types";
import {
  EmpackMiddlewareFunction,
  ILogger,
  NextFunction,
  Request,
  Response,
} from "../../core";
import onFinished from "on-finished";

const timerStorage = new AsyncLocalStorage<Timer>();

export class Timer {
  #timeSpans: TimeSpan[] = [];
  #stack: number[] = [];
  #index = 0;

  private constructor() {}

  static current() {
    return timerStorage.getStore() ?? new Timer();
  }

  static create() {
    return new Timer();
  }

  start(label: string): number {
    const id = this.#index++;
    this.#timeSpans.push({
      id,
      label,
      start: performance.now(),
      depth: this.#stack.length,
    });
    this.#stack.push(id);
    return id;
  }

  end(id: number): TimeSpan | undefined {
    const timeSpan = this.#timeSpans[id];
    if (!timeSpan) {
      return;
    }
    timeSpan.end = performance.now();
    timeSpan.duration = timeSpan.end - timeSpan.start;
    if (this.#stack.length > 0 && this.#stack[this.#stack.length - 1] === id) {
      this.#stack.pop();
    }
    return timeSpan;
  }

  reset() {
    this.#index = 0;
    this.#stack = [];
    this.#timeSpans = [];
  }

  getAllTimeSpans(): TimeSpan[] {
    return this.#timeSpans;
  }
}

export function timerMiddleware(
  logger: ILogger,
  handler?: TimerHanlder,
): EmpackMiddlewareFunction {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = Timer.create();
    const start = performance.now();

    onFinished(res, () => {
      const end = performance.now();
      const duration = end - start;
      const ts = timer.getAllTimeSpans();
      if (handler) {
        handler(duration, ts, req, res);
        return;
      }
      let msg = `Request: ${res.statusCode} ${req.method} ${req.originalUrl} - Duration: ${duration.toFixed(2)} ms`;
      const tsMsg = ts.map((span) => {
        const prefix = " ".repeat((span.depth ? span.depth * 3 : 0) + 28);
        return `\n${prefix}⎣__TimeSpan: ${span.duration?.toFixed(2) ?? "N/A"} ms - ${span.label}`;
      });
      msg += tsMsg.join("");
      logger.debug(msg);
    });

    timerStorage.run(timer, () => {
      next();
    });
  };
}

export function Track(timer?: Timer): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ): any => {
    const time = (label: string, fn: () => any) => {
      const t = timer ?? Timer.current();
      const id = t?.start(label) ?? -1;
      try {
        const result = fn();
        return result instanceof Promise
          ? result.finally(() => t?.end(id))
          : (t?.end(id), result);
      } catch (err) {
        t?.end(id);
        throw err;
      }
    };

    if (propertyKey && descriptor) {
      // Method decorator
      const original = descriptor.value;
      descriptor.value = function (...args: any[]) {
        const isStatic = typeof target === "function";
        const className = isStatic
          ? target.name
          : (target.constructor?.name ?? "Function");
        const label = `${className}.${String(propertyKey)}`;
        return time(label, () => original.apply(this, args));
      };
      return descriptor;
    }

    // Class decorator
    for (const name of Object.getOwnPropertyNames(target.prototype)) {
      if (name === "constructor") continue;
      const original = target.prototype[name];
      if (typeof original === "function") {
        target.prototype[name] = function (...args: any[]) {
          const label = `${target.name}.${name}`;
          return time(label, () => original.apply(this, args));
        };
      }
    }
  };
}
