import { BindingScope, Module } from "@empackjs/core";
import { JwTokenHelper, JwTokenSettings } from "@empackjs/utils";

export const AccessTokenSymbol = Symbol.for("ACCESSTOKEN");
export const RefreshTokenSymbol = Symbol.for("REFRESHTOKEN");

export class JwtModule extends Module {
  constructor(
    private accessTokenSetting: JwTokenSettings,
    private refreshTokenSetting: JwTokenSettings,
  ) {
    super();
  }
  register(bind: BindingScope): void {
    bind.addConstant(
      AccessTokenSymbol,
      new JwTokenHelper(this.accessTokenSetting),
    );
    bind.addConstant(
      RefreshTokenSymbol,
      new JwTokenHelper(this.refreshTokenSetting),
    );
  }
}
