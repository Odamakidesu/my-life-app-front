import { AuthToken } from "features/auth/domain/types/AuthToken";
import { Credentials } from "features/auth/domain/schemas/CredentialsSchema";

/** 認証を担う出力ポート */
export interface AuthRepository {
  login(credentials: Credentials): Promise<AuthToken>;
}
