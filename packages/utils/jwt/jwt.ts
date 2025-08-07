import { JwtHandler, JwTokenSettings } from "./types";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { IJwTokenHelper } from "./interfaces";
import { EmpackResponses, FastifyRequest, Responses } from "../../core";

export function jwtGuard(secret: string, handler?: JwtHandler) {
  return (req: FastifyRequest) => {
    function handleError(
      fallbackMessage: string,
      handlerFn?: (req: FastifyRequest) => EmpackResponses,
    ) {
      if (handlerFn) {
        return handlerFn(req);
      } else {
        return Responses.ClientError.Unauthorized(fallbackMessage);
      }
    }

    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
      return handleError("Unauthorized", handler?.onUnauthorized);
    }
    token = token.slice(7, token.length);
    try {
      const payload = verify(token, secret);
      if (handler?.onSuccess) {
        return handler.onSuccess(payload, req);
      }
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return handleError("Token Expired", handler?.onExpired);
      } else {
        return handleError("Unauthorized", handler?.onUnauthorized);
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
