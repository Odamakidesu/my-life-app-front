import { AuthRepository, CurrentUser } from "features/auth/types/types";
import { isTokenValid } from "features/auth/logic";
import { Credentials, PasswordChangeInput, parsePasswordChange } from "features/auth/types/schema";
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

  /**
   * 新規登録し、そのままログインする。
   * 登録 API はトークンを返さないため、続けてログインして画面遷移できる状態にする。
   */
  async register(credentials: Credentials): Promise<void> {
    await this.repository.register(credentials);
    await this.login(credentials);
  }

  /**
   * ログアウトする。サーバにトークンの無効化を頼んでから、手元のトークンを破棄する。
   *
   * サーバへの要求が失敗しても（通信断・既に失効している等）手元のトークンは必ず破棄する。
   * ログアウトの操作で画面がログイン状態のまま残るのが、利用者にとって一番困るため。
   */
  async logout(): Promise<void> {
    try {
      if (this.tokenStorage.load()) await this.repository.logout();
    } catch {
      // 無効化できなかったトークンも有効期限で切れる。ここでは手元の破棄を優先する
    } finally {
      this.tokenStorage.clear();
    }
  }

  /**
   * パスワードを変える。他の端末のログインは無効になり、この端末は返された新しいトークンで続ける。
   * @throws PasswordChangeValidationError 入力が規則に合わない場合
   */
  async changePassword(input: PasswordChangeInput): Promise<void> {
    const validated = parsePasswordChange(input);
    const token = await this.repository.changePassword(
      validated.currentPassword,
      validated.newPassword
    );
    this.tokenStorage.save(token);
  }

  async currentUser(): Promise<CurrentUser> {
    return this.repository.currentUser();
  }

  /** 有効なトークンを保持しているか */
  isAuthenticated(): boolean {
    const token = this.tokenStorage.load();
    return !!token && isTokenValid(token);
  }
}
