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

/**
 * 新規登録の入力に対する検証ルール。
 * サーバ（RegisterRequest）と同じ制約にして、送信前に理由を具体的に示す。
 * サーバ側でも同じ検証が走るため、ここが漏れても不正な値は保存されない。
 */
export const registrationSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "ユーザー名は3文字以上50文字以内で入力してください")
      .max(50, "ユーザー名は3文字以上50文字以内で入力してください")
      .regex(/^[A-Za-z0-9_.-]+$/, "ユーザー名に使用できるのは英数字と _ . - です"),
    password: z
      .string()
      .min(12, "パスワードは12文字以上128文字以内で入力してください")
      .max(128, "パスワードは12文字以上128文字以内で入力してください"),
    passwordConfirmation: z.string().min(1, "確認用のパスワードを入力してください"),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "パスワードが一致しません",
    path: ["passwordConfirmation"],
  });

/** 新規登録の入力値 */
export type Registration = z.infer<typeof registrationSchema>;

export const emptyRegistration: Registration = {
  username: "",
  password: "",
  passwordConfirmation: "",
};
