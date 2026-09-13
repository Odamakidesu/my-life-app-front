import { describeError } from "shared/logging/describeError";

/**
 * ログに出してよい項目だけを組み立て直せているか。
 *
 * axios の例外は config.data（ログインなら平文パスワード）と
 * config.headers（Authorization）を抱えている。そのまま console や
 * 収集基盤へ渡すと、それらがまとめて外へ出る。
 */

const axiosLoginError = {
  isAxiosError: true,
  message: "Request failed with status code 401",
  config: {
    url: "/auth/login",
    method: "post",
    data: JSON.stringify({ username: "alice", password: "super-secret" }),
    headers: { Authorization: "Bearer very-secret-token" },
  },
  response: {
    status: 401,
    data: {
      status: 401,
      error: "Unauthorized",
      message: "認証に失敗しました。",
      traceId: "trace-xyz",
    },
  },
};

describe("describeError", () => {
  test("HTTP 失敗の要約を組み立てる", () => {
    const described = describeError(axiosLoginError);

    expect(described).toMatchObject({
      kind: "http",
      status: 401,
      method: "POST",
      url: "/auth/login",
    });
  });

  test("平文パスワードと Authorization ヘッダを含めない", () => {
    const serialized = JSON.stringify(describeError(axiosLoginError));

    expect(serialized).not.toContain("super-secret");
    expect(serialized).not.toContain("very-secret-token");
    expect(serialized).not.toContain("alice");
  });

  test("traceId は取り出す（サーバログと突き合わせる鍵のため）", () => {
    expect(describeError(axiosLoginError).traceId).toBe("trace-xyz");
  });

  test("応答本文が無い場合 traceId は undefined になる", () => {
    const described = describeError({
      isAxiosError: true,
      message: "Network Error",
      config: { url: "/notes", method: "get" },
    });

    expect(described.kind).toBe("network");
    expect(described.status).toBeUndefined();
    expect(described.traceId).toBeUndefined();
  });

  test("応答本文が JSON オブジェクトでなくても壊れない", () => {
    const described = describeError({
      isAxiosError: true,
      message: "Bad Gateway",
      config: { url: "/notes", method: "get" },
      response: { status: 502, data: "<html>502</html>" },
    });

    expect(described.status).toBe(502);
    expect(described.traceId).toBeUndefined();
  });

  test("axios 以外の Error はメッセージだけを残す", () => {
    expect(describeError(new Error("想定外"))).toEqual({
      kind: "unknown",
      message: "想定外",
    });
  });

  test("Error でもない値は文字列化して扱う", () => {
    expect(describeError(42)).toEqual({ kind: "unknown", message: "42" });
  });
});
