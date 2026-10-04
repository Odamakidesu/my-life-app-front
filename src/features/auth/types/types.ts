/** 認証トークン（JWT 文字列） */
export type AuthToken = string;

import type { Credentials } from "features/auth/types/schema";

export type UserRole = "USER" | "ADMIN";

/** ログイン中の利用者 */
export type CurrentUser = {
  id: number;
  username: string;
  role: UserRole;
};

export interface AuthRepository {
  login(credentials: Credentials): Promise<AuthToken>;
  register(credentials: Credentials): Promise<void>;
  /** サーバ側でこのトークンを無効にする */
  logout(): Promise<void>;
  /** パスワードを変える。発行済みのトークンは無効になり、新しいトークンが返る */
  changePassword(currentPassword: string, newPassword: string): Promise<AuthToken>;
  currentUser(): Promise<CurrentUser>;
}

export interface TokenStorage {
  save(token: AuthToken): void;
  load(): AuthToken | null;
  clear(): void;
}
