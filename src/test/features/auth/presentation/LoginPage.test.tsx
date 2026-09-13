import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "features/auth";
import SessionExpiryWatcher from "app/components/SessionExpiryWatcher";
import { emitSessionExpired } from "shared/auth/sessionExpiry";
import { loginFailureMessage } from "features/auth/hooks/useLogin";
import { toApiFailure } from "shared/api/apiFailure";
import { act } from "react";

const renderAt = (path: string) =>
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <SessionExpiryWatcher />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/notes" element={<div>メモ画面</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("LoginPage のセッション失効表示", () => {
  test("失効で戻された場合はその旨を案内する", () => {
    renderAt("/?expired=1");

    expect(screen.getByRole("status")).toHaveTextContent(
      "セッションの有効期限が切れました"
    );
  });

  test("通常のアクセスでは案内を出さない", () => {
    renderAt("/");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("SessionExpiryWatcher", () => {
  test("失効の通知を受けるとログイン画面へ退避させる", () => {
    renderAt("/notes");
    expect(screen.getByText("メモ画面")).toBeInTheDocument();

    act(() => emitSessionExpired());

    expect(screen.queryByText("メモ画面")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "セッションの有効期限が切れました"
    );
  });
});

describe("ログイン失敗時の文言", () => {
  const axiosErrorOf = (status: number, data?: unknown) => ({
    isAxiosError: true,
    message: "failed",
    config: { url: "/auth/login" },
    response: { status, data },
  });

  test("資格情報の誤りは定型文にし、サーバの詳細を出さない", () => {
    // 理由を細かく出すとユーザー名の存在有無を推測する材料になる
    const message = loginFailureMessage(
      toApiFailure(
        axiosErrorOf(401, { status: 401, message: "ユーザーは存在しません" })
      )
    );

    expect(message).toContain("ユーザー名またはパスワードを確認してください");
    expect(message).not.toContain("存在しません");
  });

  test("レート制限は資格情報の誤りと区別して伝える", () => {
    // ここを区別しないと、制限中の利用者は正しいパスワードを入れ続けて延々失敗する
    const message = loginFailureMessage(toApiFailure(axiosErrorOf(429)));

    expect(message).toContain("試行が多すぎます");
  });

  test("通信できなかった場合は接続の問題として伝える", () => {
    const message = loginFailureMessage(
      toApiFailure({ isAxiosError: true, message: "Network Error" })
    );

    expect(message).toContain("サーバーに接続できませんでした");
  });

  test("想定外のステータスは汎用の文言にする", () => {
    const message = loginFailureMessage(toApiFailure(axiosErrorOf(500)));

    expect(message).toContain("時間をおいて再度お試しください");
  });
});
