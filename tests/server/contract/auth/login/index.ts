import { body, createRule } from "../../../../../packages/core";
import { ErrorBody } from "../../../controller/error-body";
import { INVALID_CODES } from "../../invalid-codes";

export type LoginReq = {
  account: string;
  password: string;
};

export const LoginRule = createRule<LoginReq>((key) => {
  return [
    body(key("account"))
      .notEmpty()
      .withMessage(
        new ErrorBody({
          errorCode: INVALID_CODES.ACCOUNT_IS_REQUIRED,
          message: "Account is required",
        }),
      ),
    body(key("password"))
      .notEmpty()
      .withMessage(
        new ErrorBody({
          errorCode: INVALID_CODES.PASSWORD_IS_REQUIRED,
          message: "Password is required",
        }),
      ),
  ];
});
