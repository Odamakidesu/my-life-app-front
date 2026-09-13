/** 認証トークン（JWT 文字列） */
export type AuthToken = string;

import type { Credentials } from "features/auth/types/schema";

export interface AuthRepository {
  login(credentials: Credentials): Promise<AuthToken>;
}

export interface TokenStorage {
  save(token: AuthToken): void;
  load(): AuthToken | null;
  clear(): void;
}
