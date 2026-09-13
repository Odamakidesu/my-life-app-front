import { AuthRepository } from "features/auth/types/types";
import { isTokenValid } from "features/auth/logic";
import { Credentials } from "features/auth/types/schema";
import { TokenStorage } from "features/auth/types/types";

/** 認証に関するユースケース */
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly tokenStorage: TokenStorage
  ) {}

  /** ログインし、取得したトークンを保管する */
  async login(credentials: Credentials): Promise<void> {
    const token = await this.repository.login(credentials);
    this.tokenStorage.save(token);
  }

  /** 保管中のトークンを破棄する */
  logout(): void {
    this.tokenStorage.clear();
  }

  /** 有効なトークンを保持しているか */
  isAuthenticated(): boolean {
    const token = this.tokenStorage.load();
    return !!token && isTokenValid(token);
  }
}
