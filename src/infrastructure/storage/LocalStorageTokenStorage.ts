import { AuthToken } from "features/auth/domain/types/AuthToken";
import { TokenStorage } from "features/auth/domain/repositories/TokenStorage";

const TOKEN_KEY = "token";

/** localStorage を使った TokenStorage の実装 */
export class LocalStorageTokenStorage implements TokenStorage {
  save(token: AuthToken): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  load(): AuthToken | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/** アプリ全体で共有する単一インスタンス */
export const localStorageTokenStorage = new LocalStorageTokenStorage();
