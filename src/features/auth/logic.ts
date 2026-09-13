import { AuthToken } from "features/auth/types/types";

/**
 * トークンが有効期限内かどうかを判定する。
 * 署名検証はサーバ側の責務で、ここでは exp のみを見る。
 */
export const isTokenValid = (token: AuthToken): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > now;
  } catch {
    return false;
  }
};
