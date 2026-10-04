import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AccountPage from "features/auth/AccountPage";
import { AuthService } from "features/auth/services/AuthService";
import { ServicesProvider } from "infrastructure/di/ServicesContext";

const renderWith = (authService: Partial<AuthService>) =>
  render(
    <ServicesProvider
      services={{
        authService: {
          currentUser: vi.fn().mockResolvedValue({ id: 1, username: "me", role: "USER" }),
          ...authService,
        } as AuthService,
      }}
    >
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AccountPage theme="light" />
      </MemoryRouter>
    </ServicesProvider>
  );

const fill = async (current: string, next: string, confirmation: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("現在のパスワード"), current);
  await user.type(screen.getByLabelText("新しいパスワード（12文字以上）"), next);
  await user.type(screen.getByLabelText("新しいパスワード（確認）"), confirmation);
  await user.click(screen.getByRole("button", { name: "パスワードを変更" }));
};

describe("AccountPage", () => {
  test("変更に成功したら完了を表示し、入力欄を空に戻す", async () => {
    const changePassword = vi.fn().mockResolvedValue(undefined);
    renderWith({ changePassword });

    await fill("old-password-1234", "new-password-5678", "new-password-5678");

    expect(await screen.findByText("パスワードを変更しました。")).toBeInTheDocument();
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: "old-password-1234",
      newPassword: "new-password-5678",
      newPasswordConfirmation: "new-password-5678",
    });
    expect(screen.getByLabelText("現在のパスワード")).toHaveValue("");
  });

  test("確認用が一致しなければ送信しない", async () => {
    const changePassword = vi.fn();
    renderWith({ changePassword });

    await fill("old-password-1234", "new-password-5678", "new-password-0000");

    expect(await screen.findByText("パスワードが一致しません")).toBeInTheDocument();
    expect(changePassword).not.toHaveBeenCalled();
  });

  test("現在のパスワードの誤りはサーバの文言を表示する", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const changePassword = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: { status: 400, data: { status: 400, message: "現在のパスワードが正しくありません。" } },
    });
    renderWith({ changePassword });

    await fill("wrong-password-00", "new-password-5678", "new-password-5678");

    expect(await screen.findByText("現在のパスワードが正しくありません。")).toBeInTheDocument();
  });
});
