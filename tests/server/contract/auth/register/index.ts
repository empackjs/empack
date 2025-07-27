import { ApiArrayProperty, ApiProperty } from "@empackjs/core";
import { ErrorBody } from "../../../controller/error-body";
import { INVALID_CODES } from "../../invalid-codes";
import { body, createRule } from "@empackjs/utils";

export class RegisterRes {
  @ApiProperty({
    description: "帳號",
  })
  account!: string;

  @ApiProperty({
    description: "使用者名稱",
  })
  username!: string;
}

export class Address {
  @ApiProperty({
    description: "國家",
  })
  country!: string;

  @ApiProperty({
    description: "地區",
  })
  district!: string;
}

export class RegisterReq {
  @ApiProperty({
    description: "帳號",
    required: true,
  })
  account!: string;

  @ApiProperty({
    description: "密碼",
    required: true,
  })
  password!: string;

  @ApiProperty({
    description: "使用者名稱",
    required: true,
  })
  username!: string;

  @ApiArrayProperty({
    type: Address,
  })
  address!: Address[];
}

export const RegisterRule = createRule<RegisterReq>((key) => {
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
      )
      .isLength({ min: 6 })
      .withMessage(
        new ErrorBody({
          errorCode: INVALID_CODES.PASSWORD_IS_TOO_SHORT,
          message: "Password must be at least 6 characters long",
        }),
      ),
    body(key("username"))
      .notEmpty()
      .withMessage(
        new ErrorBody({
          errorCode: INVALID_CODES.USERNAME_IS_REQUIRED,
          message: "Username is required",
        }),
      ),
  ];
});
