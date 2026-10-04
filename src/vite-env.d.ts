/// <reference types="vite/client" />

/**
 * ビルド時に埋め込まれる環境変数。
 * Vite は `VITE_` で始まる変数だけをクライアントへ公開する。
 */
interface ImportMetaEnv {
  /** API のベース URL（末尾の `/api` まで含める）。例: http://localhost:8080/api */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
