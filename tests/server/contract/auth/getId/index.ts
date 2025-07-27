import { ApiProperty } from "@empackjs/core";

export class GetIdParams {
  @ApiProperty({
    description: "房間ID",
  })
  roomId!: number;

  @ApiProperty({
    description: "伺服器ID",
  })
  serverId!: number;
}

export class GetIdQuery {
  @ApiProperty({
    description: "認證token",
  })
  token!: string;

  @ApiProperty({
    description: "使用者名稱",
  })
  username!: string;
}

export class GetIdRes {
  @ApiProperty({
    description: "認證token",
  })
  token!: string;

  @ApiProperty({
    description: "使用者名稱",
  })
  username!: string;

  @ApiProperty({
    description: "房間ID",
  })
  roomId!: number;

  @ApiProperty({
    description: "伺服器ID",
  })
  serverId!: number;
}
