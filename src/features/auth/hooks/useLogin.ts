import { useCallback, useState } from "react";
import { Credentials } from "features/auth/types/schema";
import { useServices } from "infrastructure/di/ServicesContext";
import { ApiFailure, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

const INVALID_CREDENTIALS_MESSAGE =
  "ログインに失敗しました。ユーザー名またはパスワードを確認してください。";
const RATE_LIMITED_MESSAGE =
  "ログインの試行が多すぎます。しばらく待ってから再度お試しください。";
const NETWORK_MESSAGE =
  "サーバーに接続できませんでした。通信環境を確認してください。";
const UNEXPECTED_MESSAGE =
  "ログイン処理でエラーが発生しました。時間をおいて再度お試しください。";

/**
 * 失敗の種類ごとに文言を決める。
 *
 * すべてを「ユーザー名またはパスワードを確認してください」にすると、
 * レート制限に掛かった利用者は正しいパスワードを入れ続けて延々と失敗する。
 *
 * 401 のときはサーバのメッセージではなく定型文を使う。認証失敗の理由を
 * 細かく出すと、ユーザー名の存在有無を推測する材料になるため。
 */
export const loginFailureMessage = (failure: ApiFailure): string => {
  switch (failure.kind) {
    case "unauthorized":
      return INVALID_CREDENTIALS_MESSAGE;
    case "rateLimited":
      return RATE_LIMITED_MESSAGE;
    case "network":
      return NETWORK_MESSAGE;
    case "validation":
      // 未入力などは画面側で弾かれるが、サーバ検証に落ちた場合はその内容を見せる
      return failure.message ?? INVALID_CREDENTIALS_MESSAGE;
    default:
      return UNEXPECTED_MESSAGE;
  }
};

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
        setError(loginFailureMessage(toApiFailure(e)));
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authService]
  );

  return { error, isSubmitting, login };
};
