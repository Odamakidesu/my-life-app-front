import {
  apiFailureMessage,
  toApiFailure,
} from "shared/api/apiFailure";

/** サーバの統一エラー応答を模した axios 例外を作る */
const axiosErrorOf = (status: number, data?: unknown) => ({
  isAxiosError: true,
  message: `Request failed with status code ${status}`,
  config: { url: "/notes", method: "get" },
  response: { status, data },
});

const bodyOf = (status: number, message: string, extra: object = {}) => ({
  timestamp: "2026-09-13T10:00:00Z",
  status,
  error: "Error",
  message,
  path: "/api/notes",
  traceId: "trace-abc",
  ...extra,
});

describe("toApiFailure", () => {
  test.each([
    [400, "validation"],
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "notFound"],
    [409, "conflict"],
    [429, "rateLimited"],
    [500, "server"],
    [503, "server"],
    [418, "unknown"],
  ])("HTTP %i を %s に分類する", (status, expected) => {
    expect(toApiFailure(axiosErrorOf(status)).kind).toBe(expected);
  });

  test("応答が返らなかった場合は network になる", () => {
    const failure = toApiFailure({
      isAxiosError: true,
      message: "Network Error",
      config: { url: "/notes" },
    });

    expect(failure.kind).toBe("network");
    expect(failure.status).toBeUndefined();
  });

  test("axios 以外の例外は unknown になる", () => {
    expect(toApiFailure(new Error("何か")).kind).toBe("unknown");
    expect(toApiFailure("文字列").kind).toBe("unknown");
    expect(toApiFailure(null).kind).toBe("unknown");
  });

  test("サーバのメッセージと traceId を取り出す", () => {
    const failure = toApiFailure(
      axiosErrorOf(404, bodyOf(404, "メモが見つかりませんでした"))
    );

    expect(failure.message).toBe("メモが見つかりませんでした");
    expect(failure.traceId).toBe("trace-abc");
  });

  test("項目別の検証エラーを取り出す", () => {
    const failure = toApiFailure(
      axiosErrorOf(
        400,
        bodyOf(400, "入力内容に誤りがあります。", {
          fieldErrors: { title: "タイトルは必須です" },
        })
      )
    );

    expect(failure.fieldErrors).toEqual({ title: "タイトルは必須です" });
  });

  test("fieldErrors が文字列以外の値を含んでいても壊れない", () => {
    const failure = toApiFailure(
      axiosErrorOf(400, bodyOf(400, "だめ", { fieldErrors: { a: 1, b: "ok" } }))
    );

    expect(failure.fieldErrors).toEqual({ b: "ok" });
  });

  test("本文が無くてもステータスだけで分類できる", () => {
    const failure = toApiFailure(axiosErrorOf(409));

    expect(failure.kind).toBe("conflict");
    expect(failure.message).toBeUndefined();
    expect(failure.traceId).toBeUndefined();
  });
});

describe("apiFailureMessage", () => {
  test("サーバのメッセージを呼び出し側の定型文より優先する", () => {
    const failure = toApiFailure(
      axiosErrorOf(409, bodyOf(409, "このユーザー名は既に使用されています。"))
    );

    expect(apiFailureMessage(failure, "登録に失敗しました")).toBe(
      "このユーザー名は既に使用されています。"
    );
  });

  test("項目別の検証エラーがあれば最初の1件を見せる", () => {
    const failure = toApiFailure(
      axiosErrorOf(
        400,
        bodyOf(400, "入力内容に誤りがあります。", {
          fieldErrors: { password: "パスワードは12文字以上で入力してください" },
        })
      )
    );

    expect(apiFailureMessage(failure, "失敗")).toBe(
      "パスワードは12文字以上で入力してください"
    );
  });

  test("サーバ本文が無い場合は呼び出し側の定型文を使う", () => {
    expect(apiFailureMessage(toApiFailure(axiosErrorOf(500)), "更新に失敗")).toBe(
      "更新に失敗"
    );
  });

  test("通信できなかった場合は定型文ではなく通信エラーとして伝える", () => {
    const failure = toApiFailure({ isAxiosError: true, message: "Network Error" });

    expect(apiFailureMessage(failure, "更新に失敗")).toContain(
      "サーバーに接続できませんでした"
    );
  });
});
