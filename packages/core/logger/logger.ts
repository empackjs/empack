import winston from "winston";
import "winston-daily-rotate-file";
import DailyRotateFile from "winston-daily-rotate-file";
import "dotenv/config";
import { ILogger } from "../app";

export enum LOGGER_LEVEL {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export class Logger implements ILogger {
  #logger: winston.Logger;

  constructor(
    level: LOGGER_LEVEL = LOGGER_LEVEL.INFO,
    options: DailyRotateFile.DailyRotateFileTransportOptions = {
      filename: `./log/%DATE%.log`,
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    },
  ) {
    if (!level) {
      throw new Error("level is required");
    }

    const transport = new winston.transports.DailyRotateFile(options);

    this.#logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        }),
      ),
      level,
      transports: [transport, new winston.transports.Console()],
    });
  }

  error(err: Error) {
    this.#logger.error(err.stack || err.message);
  }

  warn(message: string) {
    this.#logger.warn(message);
  }

  info(message: string) {
    this.#logger.info(message);
  }

  debug(message: string) {
    this.#logger.debug(message);
  }
}
