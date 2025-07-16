import type { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IJwTokenHelper } from "./interfaces";
import { JwtHandler, JwtHandlerResult, JwTokenSettings } from "./types";

export function jwtValidHandler(secret: string, handler?: JwtHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    function handleError(
      fallbackStatus: number,
      fallbackMessage: string,
      handlerFn?: (req: Request, res: Response) => JwtHandlerResult,
    ) {
      if (handlerFn) {
        const result = handlerFn(req, res);
        res.status(result.status).json(result.body);
      } else {
        res.status(fallbackStatus).json(fallbackMessage);
      }
    }

    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      handleError(401, "Unauthorized", handler?.onUnauthorized);
      return;
    }
    token = token.slice(7, token.length);
    try {
      const payload = jwt.verify(token, secret);
      res.locals.jwt = payload;
      if (handler?.onSuccess) {
        handler.onSuccess(payload, req, res, next);
        return;
      } else {
        next();
      }
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        handleError(401, "Token Expired", handler?.onExpired);
      } else {
        handleError(401, "Unauthorized", handler?.onUnauthorized);
      }
      return;
    }
  };
}

export class JwTokenHelper implements IJwTokenHelper {
  constructor(private settings: JwTokenSettings) {}

  generateToken(payload: any): string {
    return jwt.sign(payload, this.settings.secret, this.settings.options);
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = jwt.verify(token, this.settings.secret);
      return typeof payload === "string" ? null : payload;
    } catch {
      return null;
    }
  }
}
