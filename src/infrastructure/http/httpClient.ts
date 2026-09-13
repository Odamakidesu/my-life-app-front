import axios from "axios";
import { localStorageTokenStorage } from "infrastructure/storage/LocalStorageTokenStorage";
import { emitSessionExpired } from "shared/auth/sessionExpiry";

/** ログイン要求のパス。401 の扱いが他と異なるため、ここで判別する。 */
const LOGIN_PATH = "/auth/login";

/**
 * API 通信の共通クライアント。
 * ベース URL・認証ヘッダ付与といった技術的な関心事をここに閉じ込める。
 *
 * 認証は Authorization ヘッダの Bearer トークンのみで行う。
 * サーバはセッションを持たず（STATELESS）Cookie も発行しないため、
 * withCredentials は指定しない。サーバ側の CORS も allowCredentials=false で、
 * 許可ヘッダは Authorization / Content-Type / Accept に限定されている。
 */
export const httpClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// すべてのリクエストにトークンを付与（実行時に毎回読み取る）
httpClient.interceptors.request.use((config) => {
  const token = localStorageTokenStorage.load();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * 401 を受け取ったら、保持しているトークンを破棄してセッション失効を通知する。
 *
 * これが無いと、サーバ側で無効になったトークン（署名鍵のローテーション、
 * アカウントの無効化、期限切れ）を持ったまま画面に留まり続け、
 * 操作のたびに「取得に失敗しました」とだけ出て原因が分からない状態になる。
 * ルートガードは exp しか見ないため、この経路でしか検知できない失効がある。
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";

    // ログイン要求の 401 は「資格情報が違う」であって失効ではない。
    // ここで失効として扱うと、ログイン失敗のたびにログイン画面へ遷移し直すことになる。
    if (status === 401 && !url.endsWith(LOGIN_PATH)) {
      localStorageTokenStorage.clear();
      emitSessionExpired();
    }

    return Promise.reject(error);
  }
);

export default httpClient;
