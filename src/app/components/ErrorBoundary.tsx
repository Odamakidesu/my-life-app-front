import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * 描画中の例外を受け止める最後の砦。
 *
 * React は描画中に投げられた例外を捕まえる境界が無いと、ツリー全体を
 * アンマウントする。つまり一覧のどこか 1 箇所の不正な値で、ログアウト
 * ボタンごと画面が真っ白になり、リロードするまで復帰できない。
 * ここで受け止めて、状況と復帰手段を利用者に見せる。
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 収集基盤を導入したら、この 1 箇所を送信へ差し替える
    console.error("画面の描画に失敗しました", {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="container py-5" role="alert">
        <h1 className="h4">問題が発生しました</h1>
        <p className="text-muted">
          画面の表示中に想定外のエラーが発生しました。
          再読み込みしても直らない場合は時間をおいてお試しください。
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={this.handleReload}
        >
          再読み込み
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
