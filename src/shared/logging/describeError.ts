/**
 * 例外をログに出せる最小限の形へ落とし込む。
 *
 * axios の例外はリクエスト設定をそのまま抱えており、`config.data` には
 * 送信した本文（ログインなら平文パスワード）が、`config.headers` には
 * Authorization ヘッダが入っている。例外オブジェクトをそのまま
 * console や収集基盤へ渡すと、それらがまとめて外へ出てしまう。
 * ここで「出してよい項目」だけを明示的に組み立て直す。
 *
 * HTTP ライブラリに依存しないよう、axios の判定は構造で行う。
 */

export type ErrorKind = "http" | "network" | "unknown";

export type ErrorDescription = {
  kind: ErrorKind;
  /** HTTP ステータス。応答が返らなかった場合は undefined */
  status?: number;
  method?: string;
  /** baseURL を含まないリクエストパス */
  url?: string;
  /** ライブラリが付けた要約メッセージ（本文は含まない） */
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

export const describeError = (error: unknown): ErrorDescription => {
  if (isRecord(error) && error.isAxiosError === true) {
    const config = isRecord(error.config) ? error.config : undefined;
    const response = isRecord(error.response) ? error.response : undefined;
    const status =
      typeof response?.status === "number" ? response.status : undefined;

    return {
      kind: status === undefined ? "network" : "http",
      status,
      method: stringOrUndefined(config?.method)?.toUpperCase(),
      url: stringOrUndefined(config?.url),
      message: stringOrUndefined(error.message) ?? "",
    };
  }

  if (error instanceof Error) {
    return { kind: "unknown", message: error.message };
  }

  return { kind: "unknown", message: String(error) };
};
