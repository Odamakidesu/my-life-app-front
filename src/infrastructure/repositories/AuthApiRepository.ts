import { AxiosInstance } from "axios";
import { AuthRepository } from "features/auth/domain/repositories/AuthRepository";
import { AuthToken } from "features/auth/domain/types/AuthToken";
import { Credentials } from "features/auth/domain/schemas/CredentialsSchema";
import { parseLoginResponse } from "infrastructure/repositories/schemas/authApiSchema";

const RESOURCE = "/auth/login";

/** REST API を用いた AuthRepository の実装 */
export class AuthApiRepository implements AuthRepository {
  constructor(private readonly http: AxiosInstance) {}

  async login(credentials: Credentials): Promise<AuthToken> {
    const response = await this.http.post(RESOURCE, {
      username: credentials.username,
      password: credentials.password,
    });
    return parseLoginResponse(response.data);
  }
}
