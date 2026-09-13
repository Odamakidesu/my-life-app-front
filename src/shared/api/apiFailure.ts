/**
 * API 呼び出しの失敗を、画面が判断に使える形へ分類する。
 *
 * サーバは失敗時に統一形式の本文を返す。
 *   { timestamp, status, error, message, path, traceId, fieldErrors? }
 * これを解釈して「利用者に見せる文言」と「traceId（問い合わせ時にサーバログと
 * 突き合わせる鍵）」を取り出す。
 *
 * HTTP ライブラリに依存しないよう、axios の判定は describeError と同じく構造で行う。
 */

export type ApiFailureKind =
  /** 未認証。トークンが無い・期限切れ・無効化された */
  | "unauthorized"
  /** 認証済みだが権限が足りない */
  | "forbidden"
  /** 対象が存在しない、または自分のものではない */
  | "notFound"
  /** 一意制約違反など、状態の衝突 */
  | "conflict"
  /** 入力値がサーバの検証に通らなかった */
  | "validation"
  /** レート制限に掛かった */
  | "rateLimited"
  /** サーバ側のエラー */
  | "server"
  /** 応答そのものが返らなかった */
  | "network"
  | "unknown";

export type ApiFailure = {
  kind: ApiFailureKind;
  status?: number;
  /** サーバが返した利用者向けメッセージ。内部情報は含まれない */
  message?: string;
  /** 項目別の検証エラー（400 のとき） */
  fieldErrors?: Record<string, string>;
  /** サーバログと突き合わせるための相関ID */
  traceId?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const stringOrUndefined = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const toFieldErrors = (value: unknown): Record<string, string> | undefined => {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string"
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const kindOf = (status: number | undefined): ApiFailureKind => {
  switch (status) {
    case undefined:
      return "network";
    case 400:
      return "validation";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "notFound";
    case 409:
      return "conflict";
    case 429:
      return "rateLimited";
    default:
      return status >= 500 ? "server" : "unknown";
  }
};

/** 例外を ApiFailure へ分類する。API 以外の例外は "unknown" になる。 */
export const toApiFailure = (error: unknown): ApiFailure => {
  if (!isRecord(error) || error.isAxiosError !== true) {
    return { kind: "unknown" };
  }

  const response = isRecord(error.response) ? error.response : undefined;
  const status =
    typeof response?.status === "number" ? response.status : undefined;
  const body = isRecord(response?.data) ? response?.data : undefined;

  return {
    kind: kindOf(status),
    status,
    message: stringOrUndefined(body?.message),
    fieldErrors: toFieldErrors(body?.fieldErrors),
    traceId: stringOrUndefined(body?.traceId),
  };
};

/**
 * 利用者に見せる文言を決める。
 *
 * サーバのメッセージを優先する。「メモが見つかりませんでした」のように
 * 呼び出し側の定型文より具体的で、かつ内部情報を含まない形で返ってくるため。
 * サーバが本文を返さない場合（ネットワーク断など）は呼び出し側の文言を使う。
 */
export const apiFailureMessage = (
  failure: ApiFailure,
  fallback: string
): string => {
  if (failure.kind === "network") {
    return "サーバーに接続できませんでした。通信環境を確認してください。";
  }

  // 項目別の検証エラーは、最初の1件を具体的に見せる
  const firstFieldError = failure.fieldErrors
    ? Object.values(failure.fieldErrors)[0]
    : undefined;

  return firstFieldError ?? failure.message ?? fallback;
};
