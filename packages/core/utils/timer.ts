import { NextFunction, Request, Response } from "express";
import { performance } from "node:perf_hooks";
import { AsyncLocalStorage } from "node:async_hooks";
import onFinished from "on-finished";
import { EmpackMiddlewareFunction, ILogger } from "../app";
import { TimerHanlder, TimeSpan } from ".";

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
