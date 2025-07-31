import { ResponseWith } from "./types/index";

export abstract class ResWith {
  #withData: ResponseWith = {};

  with(data: ResponseWith): this {
    this.#withData = {
      headers: {
        ...(this.#withData.headers || {}),
        ...(data.headers || {}),
      },
      cookies: [...(this.#withData.cookies || []), ...(data.cookies || [])],
    };
    return this;
  }

  getWithData(): ResponseWith {
    return this.#withData;
  }
}

export class RedirectResponse extends ResWith {
  status: number;
  url: string;
  constructor(url: string, status: number) {
    super();
    this.status = status;
    this.url = url;
  }
}

export class JsonResponse extends ResWith {
  status: number;
  body: any;

  constructor(status: number, body: any) {
    super();
    this.status = status;
    this.body = body;
  }
}

export class FileResponse extends ResWith {
  constructor(
    public readonly fileName: string,
    public readonly filePath: string,
  ) {
    super();
  }
}

export class BufferResponse extends ResWith {
  constructor(
    public readonly data: Buffer,
    public readonly fileName: string,
    public readonly mimeType: string = "application/octet-stream",
  ) {
    super();
    this.with({
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": mimeType,
      },
    });
  }
}

export class Responses {
  static OK<T = any>(data: T) {
    return new JsonResponse(200, data);
  }

  static Created<T = any>(data: T) {
    return new JsonResponse(201, data);
  }

  static Accepted<T = any>(data: T) {
    return new JsonResponse(202, data);
  }

  static NoContent() {
    return new JsonResponse(204, null);
  }

  static ClientError = {
    BadRequest: <T = any>(err: T) => new JsonResponse(400, err),
    Unauthorized: <T = any>(err: T) => new JsonResponse(401, err),
    Forbidden: <T = any>(err: T) => new JsonResponse(403, err),
    NotFound: <T = any>(err: T) => new JsonResponse(404, err),
    MethodNotAllowed: <T = any>(err: T) => new JsonResponse(405, err),
    Conflict: <T = any>(err: T) => new JsonResponse(409, err),
    UnsupportedMediaType: <T = any>(err: T) => new JsonResponse(415, err),
    TooManyRequests: <T = any>(err: T) => new JsonResponse(429, err),
  };

  static ServerError = {
    Internal: <T = any>(err: T) => new JsonResponse(500, err),
    NotImplemented: <T = any>(err: T) => new JsonResponse(501, err),
    BadGateway: <T = any>(err: T) => new JsonResponse(502, err),
    ServiceUnavailable: <T = any>(err: T) => new JsonResponse(503, err),
    GatewayTimeout: <T = any>(err: T) => new JsonResponse(504, err),
  };

  static Redirect = {
    MovedPermanently: (url: string) => new RedirectResponse(url, 301),
    Found: (url: string) => new RedirectResponse(url, 302),
    SeeOther: (url: string) => new RedirectResponse(url, 303),
    TemporaryRedirect: (url: string) => new RedirectResponse(url, 307),
    PermanentRedirect: (url: string) => new RedirectResponse(url, 308),
  };

  static File(fileName: string, filePath: string) {
    return new FileResponse(fileName, filePath);
  }

  static Buffer(buffer: Buffer, fileName: string, mimeType: string) {
    return new BufferResponse(buffer, fileName, mimeType);
  }
}
