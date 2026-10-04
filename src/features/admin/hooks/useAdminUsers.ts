import { useCallback, useEffect, useState } from "react";
import { ManagedUser } from "features/admin/types/types";
import { UserRole } from "features/auth/types/types";
import { useServices } from "infrastructure/di/ServicesContext";
import { Notifier } from "shared/types/Notifier";
import { apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

/** 管理画面の利用者一覧と変更操作を扱うアダプタ */
export const useAdminUsers = (notify: Notifier) => {
  const { adminService } = useServices();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);

  const reportFailure = useCallback(
    (error: unknown, fallbackMessage: string) => {
      console.error(fallbackMessage, describeError(error));
      const failure = toApiFailure(error);
      if (failure.kind === "forbidden") {
        setIsForbidden(true);
      } else if (failure.kind !== "unauthorized") {
        notify(apiFailureMessage(failure, fallbackMessage), "danger");
      }
    },
    [notify]
  );

  useEffect(() => {
    adminService
      .listUsers()
      .then(setUsers)
      .catch((error) => reportFailure(error, "利用者一覧の取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [adminService, reportFailure]);

  /** 変更後の利用者で一覧の該当行を置き換える */
  const apply = useCallback(
    async (action: () => Promise<ManagedUser>, successMessage: string, fallbackMessage: string) => {
      try {
        const updated = await action();
        setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)));
        notify(successMessage, "success");
      } catch (error) {
        reportFailure(error, fallbackMessage);
      }
    },
    [notify, reportFailure]
  );

  const changeRole = useCallback(
    (user: ManagedUser, role: UserRole) =>
      apply(
        () => adminService.changeRole(user.id, role),
        `${user.username} の権限を ${role === "ADMIN" ? "管理者" : "一般"} にしました`,
        "権限の変更に失敗しました"
      ),
    [adminService, apply]
  );

  const changeEnabled = useCallback(
    (user: ManagedUser, enabled: boolean) =>
      apply(
        () => adminService.changeEnabled(user.id, enabled),
        `${user.username} を${enabled ? "有効" : "無効"}にしました`,
        "有効・無効の変更に失敗しました"
      ),
    [adminService, apply]
  );

  return { users, isLoading, isForbidden, changeRole, changeEnabled };
};
