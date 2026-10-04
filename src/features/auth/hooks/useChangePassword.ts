import { useCallback, useState } from "react";
import {
  PasswordChangeInput,
  PasswordChangeValidationError,
} from "features/auth/types/schema";
import { useServices } from "infrastructure/di/ServicesContext";
import { apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

const UNEXPECTED_MESSAGE =
  "パスワードの変更でエラーが発生しました。時間をおいて再度お試しください。";

/** パスワード変更ユースケースを扱うアダプタ */
export const useChangePassword = () => {
  const { authService } = useServices();
  const [error, setError] = useState("");

  const changePassword = useCallback(
    async (input: PasswordChangeInput): Promise<boolean> => {
      try {
        await authService.changePassword(input);
        setError("");
        return true;
      } catch (e) {
        if (e instanceof PasswordChangeValidationError) {
          setError(e.message);
          return false;
        }
        // 例外そのものを渡すと config.data の平文パスワードまで出力される
        console.error("パスワード変更失敗", describeError(e));
        const failure = toApiFailure(e);
        // 現在のパスワードの誤り（400）はサーバの文言がそのまま次の行動を示す
        setError(
          failure.kind === "unauthorized" ? "" : apiFailureMessage(failure, UNEXPECTED_MESSAGE)
        );
        return false;
      }
    },
    [authService]
  );

  return { error, changePassword };
};
