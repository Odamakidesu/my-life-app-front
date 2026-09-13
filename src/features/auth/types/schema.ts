import { z } from "zod";

/** ログイン時の資格情報に対するドメインの検証ルール */
export const credentialsSchema = z.object({
  username: z.string().trim().min(1, "ユーザー名を入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

/** ログイン時の資格情報（値オブジェクト） */
export type Credentials = z.infer<typeof credentialsSchema>;

/** 空のフォーム初期値 */
export const emptyCredentials: Credentials = {
  username: "",
  password: "",
};
