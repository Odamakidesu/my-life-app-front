import { useCallback, useState } from "react";
import { Registration } from "features/auth/types/schema";
import { useServices } from "infrastructure/di/ServicesContext";
import { ApiFailure, apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

const RATE_LIMITED_MESSAGE =
  "試行が多すぎます。しばらく待ってから再度お試しください。";
const UNEXPECTED_MESSAGE =
  "登録処理でエラーが発生しました。時間をおいて再度お試しください。";

/**
 * 失敗の種類ごとに文言を決める。
 * 409（ユーザー名の重複）と 400（入力不備）はサーバの文言が具体的なのでそれを見せる。
 */
export const registerFailureMessage = (failure: ApiFailure): string => {
  switch (failure.kind) {
    case "conflict":
    case "validation":
    case "network":
      return apiFailureMessage(failure, UNEXPECTED_MESSAGE);
    case "rateLimited":
      return RATE_LIMITED_MESSAGE;
    default:
      return UNEXPECTED_MESSAGE;
  }
};

/** 新規登録ユースケースを扱うアダプタ */
export const useRegister = () => {
  const { authService } = useServices();
  const [error, setError] = useState("");

  const register = useCallback(
    async (registration: Registration): Promise<boolean> => {
      try {
        await authService.register({
          username: registration.username,
          password: registration.password,
        });
        setError("");
        return true;
      } catch (e) {
        // 例外そのものを渡すと config.data の平文パスワードまで出力される
        console.error("新規登録失敗", describeError(e));
        setError(registerFailureMessage(toApiFailure(e)));
        return false;
      }
    },
    [authService]
  );

  return { error, register };
};
