import { z } from "zod";
import { ManagedUser } from "features/admin/types/types";

const managedUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  enabled: z.boolean(),
  role: z.enum(["USER", "ADMIN"]),
});

export class AdminResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminResponseError";
    Object.setPrototypeOf(this, AdminResponseError.prototype);
  }
}

export const parseManagedUser = (data: unknown): ManagedUser => {
  const result = managedUserSchema.safeParse(data);
  if (!result.success) {
    throw new AdminResponseError("利用者の応答が想定した形式ではありません");
  }
  return result.data;
};

export const parseManagedUserList = (data: unknown): ManagedUser[] => {
  const result = z.array(managedUserSchema).safeParse(data);
  if (!result.success) {
    throw new AdminResponseError("利用者一覧の応答が想定した形式ではありません");
  }
  return result.data;
};
