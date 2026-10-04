import { registrationSchema } from "features/auth/types/schema";

/** 新規登録の入力検証（サーバの RegisterRequest と同じ制約） */
const valid = {
  username: "new_user.01",
  password: "abcdefghijkl",
  passwordConfirmation: "abcdefghijkl",
};

const firstMessage = (input: typeof valid) => {
  const result = registrationSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
};

describe("registrationSchema", () => {
  test("条件を満たす入力は通る", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });

  test("ユーザー名は3文字以上", () => {
    expect(firstMessage({ ...valid, username: "ab" })).toBe(
      "ユーザー名は3文字以上50文字以内で入力してください"
    );
  });

  test("ユーザー名に使えない文字を弾く", () => {
    expect(firstMessage({ ...valid, username: "ユーザー" })).toBe(
      "ユーザー名に使用できるのは英数字と _ . - です"
    );
  });

  test("パスワードは12文字以上", () => {
    expect(
      firstMessage({ ...valid, password: "short", passwordConfirmation: "short" })
    ).toBe("パスワードは12文字以上128文字以内で入力してください");
  });

  test("確認用パスワードが一致しないと弾く", () => {
    const result = registrationSchema.safeParse({
      ...valid,
      passwordConfirmation: "abcdefghijkX",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["passwordConfirmation"]);
    expect(result.error?.issues[0]?.message).toBe("パスワードが一致しません");
  });
});
