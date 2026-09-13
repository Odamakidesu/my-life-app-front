import { describeError } from "shared/logging/describeError";

/**
 * どのコンポーネントにも属さない例外を拾うための登録口。
 *
 * ErrorBoundary が捕まえるのは描画中の例外だけで、await し忘れた
 * Promise の失敗やイベントハンドラ外の例外はそのまま消える。
 * 収集基盤を導入する際は、この 2 箇所を送信へ差し替えれば足りる。
 */
export const registerGlobalErrorHandlers = (): void => {
  window.addEventListener("unhandledrejection", (event) => {
    console.error("未処理の Promise 失敗", describeError(event.reason));
  });

  window.addEventListener("error", (event) => {
    console.error("未処理のエラー", describeError(event.error ?? event.message));
  });
};
