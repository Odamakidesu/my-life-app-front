import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RegisterPage from "features/auth/RegisterPage";
import { AuthService } from "features/auth/services/AuthService";
import { ServicesProvider } from "infrastructure/di/ServicesContext";
import { registerFailureMessage } from "features/auth/hooks/useRegister";
import { toApiFailure } from "shared/api/apiFailure";

const renderWith = (authService: Partial<AuthService>) =>
  render(
    <ServicesProvider services={{ authService: authService as AuthService }}>
      <MemoryRouter
        initialEntries={["/register"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/notes" element={<div>メモ画面</div>} />
        </Routes>
      </MemoryRouter>
    </ServicesProvider>
  );

const fillForm = async (password = "abcdefghijkl", confirmation = password) => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("ユーザー名"), "new_user");
  await user.type(screen.getByLabelText("パスワード"), password);
  await user.type(screen.getByLabelText("パスワード（確認）"), confirmation);
  await user.click(screen.getByRole("button", { name: "登録する" }));
};

describe("RegisterPage", () => {
  test("登録に成功するとメモ画面へ進む", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    renderWith({ register });

    await fillForm();

    expect(register).toHaveBeenCalledWith({
      username: "new_user",
      password: "abcdefghijkl",
    });
    expect(await screen.findByText("メモ画面")).toBeInTheDocument();
  });

  test("確認用パスワードが一致しなければ送信しない", async () => {
    const register = vi.fn();
    renderWith({ register });

    await fillForm("abcdefghijkl", "abcdefghijkX");

    expect(await screen.findByText("パスワードが一致しません")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test("ユーザー名が使われている場合はサーバの文言を見せる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const register = vi.fn().mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: { message: "このユーザー名は既に使用されています。" },
      },
    });
    renderWith({ register });

    await fillForm();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "このユーザー名は既に使用されています。"
    );
    expect(screen.queryByText("メモ画面")).not.toBeInTheDocument();
  });
});

describe("registerFailureMessage", () => {
  test("レート制限は待つよう案内する", () => {
    const failure = toApiFailure({ isAxiosError: true, response: { status: 429 } });
    expect(registerFailureMessage(failure)).toContain("しばらく待って");
  });
});
