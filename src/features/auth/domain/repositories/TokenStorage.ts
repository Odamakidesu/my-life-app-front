import { AuthToken } from "features/auth/domain/types/AuthToken";

/**
 * 認証トークンの保管を担う出力ポート。
 * localStorage などの具体的な保管手段は infrastructure 層が決める。
 */
export interface TokenStorage {
  save(token: AuthToken): void;
  load(): AuthToken | null;
  clear(): void;
}
