import { useCallback, useState } from "react";
import { Credentials } from "features/auth/domain/schemas/CredentialsSchema";
import { useServices } from "infrastructure/di/ServicesContext";
import { describeError } from "shared/logging/describeError";

const LOGIN_FAILED_MESSAGE =
  "ログインに失敗しました。ユーザー名またはパスワードを確認してください。";

/** ログインユースケースを扱うアダプタ */
export const useLogin = () => {
  const { authService } = useServices();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useCallback(
    async (credentials: Credentials): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        await authService.login(credentials);
        setError("");
        return true;
      } catch (e) {
        // 例外そのものを渡すと config.data の平文パスワードまで出力される
        console.error("ログイン失敗", describeError(e));
        setError(LOGIN_FAILED_MESSAGE);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authService]
  );

  return { error, isSubmitting, login };
};
