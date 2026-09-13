import axios from "axios";
import { localStorageTokenStorage } from "infrastructure/storage/LocalStorageTokenStorage";

/**
 * API 通信の共通クライアント。
 * ベース URL・認証ヘッダ付与といった技術的な関心事をここに閉じ込める。
 *
 * 認証は Authorization ヘッダの Bearer トークンのみで行う。
 * サーバはセッションを持たず（STATELESS）Cookie も発行しないため、
 * withCredentials は指定しない。
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

export default httpClient;
