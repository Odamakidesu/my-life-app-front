import { AdminRepository, ManagedUser } from "features/admin/types/types";
import { UserRole } from "features/auth/types/types";

/**
 * 管理者のユースケース（利用者の権限と有効・無効の変更）。
 * 権限の判定はサーバが行う。一般ユーザーが呼んでも 403 になるだけ。
 */
export class AdminService {
  constructor(private readonly repository: AdminRepository) {}

  listUsers(): Promise<ManagedUser[]> {
    return this.repository.findUsers();
  }

  changeRole(id: number, role: UserRole): Promise<ManagedUser> {
    return this.repository.changeRole(id, role);
  }

  changeEnabled(id: number, enabled: boolean): Promise<ManagedUser> {
    return this.repository.changeEnabled(id, enabled);
  }
}
