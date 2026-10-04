import { AxiosInstance } from "axios";
import { AdminRepository, ManagedUser } from "features/admin/types/types";
import { UserRole } from "features/auth/types/types";
import {
  parseManagedUser,
  parseManagedUserList,
} from "infrastructure/repositories/schemas/adminApiSchema";

const RESOURCE = "/admin/users";

/** 1 回で取得する件数（サーバの上限）。個人利用の規模ではこれで全員が収まる */
const PAGE_SIZE = 200;

/** REST API を用いた AdminRepository の実装 */
export class AdminApiRepository implements AdminRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findUsers(): Promise<ManagedUser[]> {
    const response = await this.http.get(RESOURCE, { params: { page: 0, size: PAGE_SIZE } });
    return parseManagedUserList(response.data);
  }

  async changeRole(id: number, role: UserRole): Promise<ManagedUser> {
    const response = await this.http.put(`${RESOURCE}/${id}/role`, { role });
    return parseManagedUser(response.data);
  }

  async changeEnabled(id: number, enabled: boolean): Promise<ManagedUser> {
    const response = await this.http.put(`${RESOURCE}/${id}/enabled`, { enabled });
    return parseManagedUser(response.data);
  }
}
