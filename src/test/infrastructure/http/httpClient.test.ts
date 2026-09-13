import { httpClient } from "infrastructure/http/httpClient";
import { localStorageTokenStorage } from "infrastructure/storage/LocalStorageTokenStorage";
import { SESSION_EXPIRED_EVENT } from "shared/auth/sessionExpiry";

/**
 * 応答インターセプタの振る舞い。
 *
 * 401 を握り潰すと、サーバ側で無効になったトークンを持ったまま画面に留まり続け、
 * 操作のたびに「失敗しました」とだけ出る状態になる。
 */

/** 指定のステータスで必ず失敗するアダプタを仕込む */
const failWith = (status: number) => {
  httpClient.defaults.adapter = (config) => {
    const error = new Error(`Request failed with status code ${status}`) as Error & {
      isAxiosError: boolean;
      config: unknown;
      response: { status: number; data: unknown };
    };
    error.isAxiosError = true;
    error.config = config;
    error.response = { status, data: { status, message: "だめ" } };
    return Promise.reject(error);
  };
};

/** 常に成功するアダプタを仕込む */
const succeedWith = (data: unknown) => {
  httpClient.defaults.adapter = (config) =>
    Promise.resolve({
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    });
};

describe("httpClient の 401 ハンドリング", () => {
  let sessionExpired: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    sessionExpired = jest.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, sessionExpired);
  });

  afterEach(() => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, sessionExpired);
    delete httpClient.defaults.adapter;
  });

  test("保護された要求が401なら、トークンを破棄してセッション失効を通知する", async () => {
    localStorageTokenStorage.save("stale-token");
    failWith(401);

    await expect(httpClient.get("/notes")).rejects.toBeDefined();

    expect(localStorageTokenStorage.load()).toBeNull();
    expect(sessionExpired).toHaveBeenCalledTimes(1);
  });

  test("ログイン要求の401は失効として扱わない", async () => {
    localStorageTokenStorage.save("someone-elses-token");
    failWith(401);

    await expect(httpClient.post("/auth/login")).rejects.toBeDefined();

    // ログイン失敗のたびに退避させると、ログイン画面へ遷移し直す動きになる
    expect(sessionExpired).not.toHaveBeenCalled();
    expect(localStorageTokenStorage.load()).toBe("someone-elses-token");
  });

  test("401以外の失敗ではトークンを破棄しない", async () => {
    localStorageTokenStorage.save("valid-token");
    failWith(500);

    await expect(httpClient.get("/notes")).rejects.toBeDefined();

    expect(localStorageTokenStorage.load()).toBe("valid-token");
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  test("403（権限不足）ではトークンを破棄しない", async () => {
    localStorageTokenStorage.save("valid-token");
    failWith(403);

    await expect(httpClient.get("/api/admin/users/1/role")).rejects.toBeDefined();

    // 権限が足りないだけで、認証そのものは有効
    expect(localStorageTokenStorage.load()).toBe("valid-token");
    expect(sessionExpired).not.toHaveBeenCalled();
  });

  test("トークンがあれば Authorization ヘッダを付与する", async () => {
    localStorageTokenStorage.save("my-token");
    succeedWith([]);

    const response = await httpClient.get("/notes");

    expect(response.config.headers.Authorization).toBe("Bearer my-token");
  });

  test("トークンが無ければ Authorization ヘッダを付けない", async () => {
    succeedWith([]);

    const response = await httpClient.get("/notes");

    expect(response.config.headers.Authorization).toBeUndefined();
  });
});
