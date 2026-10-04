import { UserRole } from "features/auth/types/types";

/** 管理画面で扱う利用者 */
export type ManagedUser = {
  id: number;
  username: string;
  enabled: boolean;
  role: UserRole;
};

export interface AdminRepository {
  findUsers(): Promise<ManagedUser[]>;
  changeRole(id: number, role: UserRole): Promise<ManagedUser>;
  changeEnabled(id: number, enabled: boolean): Promise<ManagedUser>;
}
