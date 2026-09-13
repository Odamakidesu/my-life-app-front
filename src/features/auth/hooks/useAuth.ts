import { useCallback } from "react";
import { useServices } from "infrastructure/di/ServicesContext";

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
