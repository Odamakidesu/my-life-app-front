import { AuthRepository } from "features/auth/domain/repositories/AuthRepository";
import { isTokenValid } from "features/auth/domain/policies/AuthTokenPolicy";
import { Credentials } from "features/auth/domain/schemas/CredentialsSchema";
import { TokenStorage } from "features/auth/domain/repositories/TokenStorage";

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
