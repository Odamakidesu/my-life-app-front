import { AxiosInstance } from "axios";
import { AuthRepository } from "features/auth/types/types";
import { AuthToken } from "features/auth/types/types";
import { Credentials } from "features/auth/types/schema";
import { parseLoginResponse } from "infrastructure/repositories/schemas/authApiSchema";

const LOGIN_RESOURCE = "/auth/login";
const REGISTER_RESOURCE = "/auth/register";

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
}
