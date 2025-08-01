import { JwtHandler, JwtHandlerResult, JwTokenSettings } from "./types";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { IJwTokenHelper } from "./interfaces";
import { FastifyReply, FastifyRequest } from "../../core";

export function jwtGuard(secret: string, handler?: JwtHandler) {
  return (req: FastifyRequest, reply: FastifyReply) => {
    function handleError(
      fallbackStatus: number,
      fallbackMessage: string,
      handlerFn?: (
        req: FastifyRequest,
        reply: FastifyReply,
      ) => JwtHandlerResult,
    ) {
      if (handlerFn) {
        const result = handlerFn(req, reply);
        return reply.status(result.status).send(result.body);
      } else {
        return reply.status(fallbackStatus).send(fallbackMessage);
      }
    }

    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      handleError(401, "Unauthorized", handler?.onUnauthorized);
      return;
    }
    token = token.slice(7, token.length);
    try {
      const payload = verify(token, secret);
      if (handler?.onSuccess) {
        handler.onSuccess(payload, req, reply);
        return;
      }
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        handleError(401, "Token Expired", handler?.onExpired);
      } else {
        handleError(401, "Unauthorized", handler?.onUnauthorized);
      }
    }
  };
}

export class JwTokenHelper implements IJwTokenHelper {
  constructor(private settings: JwTokenSettings) {}

  generateToken(payload: any): string {
    return sign(payload, this.settings.secret, this.settings.options);
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      const payload = verify(token, this.settings.secret);
      return typeof payload === "string" ? null : payload;
    } catch {
      return null;
    }
  }
}
