import { z } from "zod";
import { AuthToken } from "features/auth/domain/types/AuthToken";

/**
 * ログイン応答の形。
 *
 * 検証せずに token を取り出すと、キー名が変わった場合に undefined のまま
 * 保存され（localStorage には文字列 "undefined" が入る）、ログインは成功扱い
 * なのにルートガードが即座に弾く、という無言の無限ループになる。
 * ここで弾いて、ログイン失敗として利用者に見える形にする。
 */
const loginResponseSchema = z.object({
  token: z.string().min(1),
});

/** ログイン応答が想定した形式でなかったことを表す例外 */
export class AuthResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthResponseError";
    Object.setPrototypeOf(this, AuthResponseError.prototype);
  }
}

export const parseLoginResponse = (data: unknown): AuthToken => {
  const result = loginResponseSchema.safeParse(data);
  if (!result.success) {
    throw new AuthResponseError("ログイン応答にトークンが含まれていません");
  }
  return result.data.token;
};
