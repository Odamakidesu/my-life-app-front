import { useCallback, useEffect, useState } from "react";
import { CurrentUser } from "features/auth/types/types";
import { useServices } from "infrastructure/di/ServicesContext";
import { describeError } from "shared/logging/describeError";

/** 認証状態の参照とログアウトを扱うアダプタ */
export const useAuth = () => {
  const { authService } = useServices();

  const isAuthenticated = useCallback(
    () => authService.isAuthenticated(),
    [authService]
  );
  const logout = useCallback(() => authService.logout(), [authService]);

  return { isAuthenticated, logout };
};

/**
 * ログイン中の利用者。取得できるまで（または失敗したら）null。
 * 画面の出し分け（管理画面への入口など）にだけ使う。権限の判定そのものはサーバが行う。
 */
export const useCurrentUser = (): CurrentUser | null => {
  const { authService } = useServices();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let active = true;
    authService
      .currentUser()
      .then((loaded) => {
        if (active) setUser(loaded);
      })
      .catch((error) => console.error("利用者情報の取得失敗", describeError(error)));
    return () => {
      active = false;
    };
  }, [authService]);

  return user;
};
