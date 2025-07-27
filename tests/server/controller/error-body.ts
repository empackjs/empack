import { ApiProperty } from "../../../packages/core";

export type errorBody = {
  errorCode: string;
  message?: string;
};

export class ErrorBody {
  @ApiProperty({
    description: "錯誤代碼",
    example: "USER_ALREADY_EXISTS"
  })
  errorCode: string;

  @ApiProperty({
    description: "錯誤訊息",
    example: "使用者已存在"
  })
  message?: string;

  constructor(body: errorBody) {
    this.errorCode = body.errorCode;
    this.message = body.message;
  }
}
