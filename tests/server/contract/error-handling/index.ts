import {
  FastifyError,
  FastifyReply,
  FastifyRequest,
} from "../../../../packages/core";

enum ERROR_CODES {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
}

export type ErrorBody = {
  errorCode: string;
  message?: string;
};

export const ErrorHandler = (
  err: FastifyError,
  _req: FastifyRequest,
  reply: FastifyReply,
) => {
  if (err.validation) {
    const details = err.validation.map((item) => {
      return {
        message: item.message,
        field: item.instancePath.replace("/", ""),
      };
    });
    reply.code(400).send({
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      message: "Validation Error",
      details,
    });
    return;
  }

  console.log(err.stack);
  reply.code(500).send({
    errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",
  });
};

export const NotFoundHandler = (req: FastifyRequest, reply: FastifyReply) => {
  reply.code(404).send({
    errorCode: ERROR_CODES.NOT_FOUND_ERROR,
    message: `Route ${req.method}:${req.url} not found`,
  });
};
