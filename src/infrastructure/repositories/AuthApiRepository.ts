import { AxiosInstance } from "axios";
import { AuthRepository, AuthToken, CurrentUser } from "features/auth/types/types";
import { Credentials } from "features/auth/types/schema";
import {
  parseCurrentUser,
  parseLoginResponse,
} from "infrastructure/repositories/schemas/authApiSchema";

const LOGIN_RESOURCE = "/auth/login";
const REGISTER_RESOURCE = "/auth/register";
const LOGOUT_RESOURCE = "/auth/logout";
const PASSWORD_RESOURCE = "/auth/password";
const ME_RESOURCE = "/auth/me";

/** REST API を用いた AuthRepository の実装 */
export class AuthApiRepository implements AuthRepository {
  constructor(private readonly http: AxiosInstance) {}

  async login(credentials: Credentials): Promise<AuthToken> {
    const response = await this.http.post(LOGIN_RESOURCE, {
      username: credentials.username,
      password: credentials.password,
    });
    return parseLoginResponse(response.data);
  }

  /** 登録する。応答のユーザー情報は使わない（続けてログインしてトークンを得る） */
  async register(credentials: Credentials): Promise<void> {
    await this.http.post(REGISTER_RESOURCE, {
      username: credentials.username,
      password: credentials.password,
    });
  }

  async logout(): Promise<void> {
    await this.http.post(LOGOUT_RESOURCE);
  }

  /** 応答はログインと同じ形（新しいトークン） */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthToken> {
    const response = await this.http.put(PASSWORD_RESOURCE, { currentPassword, newPassword });
    return parseLoginResponse(response.data);
  }

  async currentUser(): Promise<CurrentUser> {
    const response = await this.http.get(ME_RESOURCE);
    return parseCurrentUser(response.data);
  }
}
