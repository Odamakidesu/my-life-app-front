/**
 * セッション失効の通知。
 *
 * サーバが 401 を返した時点で、保持しているトークンはもう使えない。
 * 期限切れだけでなく、署名鍵のローテーションや管理者によるアカウント無効化でも起こる。
 * いずれも「クライアント側では判定できない失効」であり、
 * exp を見るだけのルートガード（AuthTokenPolicy）では検知できない。
 *
 * 通信層（interceptor）が画面遷移まで担うと責務が混ざるため、
 * ここで出来事だけを伝え、遷移はアプリ層が引き受ける。
 */

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/** ログイン画面へ「失効により戻された」ことを伝えるクエリパラメータ */
export const SESSION_EXPIRED_PARAM = "expired";

export const emitSessionExpired = (): void => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

/** 購読する。戻り値を呼ぶと購読を解除する。 */
export const onSessionExpired = (handler: () => void): (() => void) => {
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
};
