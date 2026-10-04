import { z } from "zod";
import { AuthToken, CurrentUser } from "features/auth/types/types";

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

const currentUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  // 知らない権限は一般ユーザーとして扱う（管理画面への入口を誤って出さない）
  role: z.enum(["USER", "ADMIN"]).catch("USER"),
});

export const parseCurrentUser = (data: unknown): CurrentUser => {
  const result = currentUserSchema.safeParse(data);
  if (!result.success) {
    throw new AuthResponseError("利用者情報の応答が想定した形式ではありません");
  }
  return result.data;
};
