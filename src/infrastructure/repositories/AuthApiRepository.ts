import { AxiosInstance } from "axios";
import { AuthRepository } from "features/auth/types/types";
import { AuthToken } from "features/auth/types/types";
import { Credentials } from "features/auth/types/schema";
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
