import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AdminPage from "features/admin";
import { AdminService } from "features/admin/services/AdminService";
import { ManagedUser } from "features/admin/types/types";
import { AuthService } from "features/auth/services/AuthService";
import { ServicesProvider } from "infrastructure/di/ServicesContext";

const admin: ManagedUser = { id: 1, username: "admin", enabled: true, role: "ADMIN" };
const alice: ManagedUser = { id: 2, username: "alice", enabled: true, role: "USER" };

const renderWith = (adminService: Partial<AdminService>) =>
  render(
    <ServicesProvider
      services={{
        adminService: adminService as AdminService,
        authService: {
          currentUser: vi.fn().mockResolvedValue({ id: 1, username: "admin", role: "ADMIN" }),
        } as unknown as AuthService,
      }}
    >
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AdminPage theme="light" />
      </MemoryRouter>
    </ServicesProvider>
  );

describe("AdminPage", () => {
  test("自分自身の行は変更できない", async () => {
    renderWith({ listUsers: vi.fn().mockResolvedValue([admin, alice]) });

    await screen.findByText("alice");
    expect(await screen.findByText("あなた")).toBeInTheDocument();
    expect(screen.getByLabelText("admin の権限")).toBeDisabled();
    expect(screen.getByLabelText("alice の権限")).toBeEnabled();
  });

  test("権限を変えると、サーバが返した内容で行が更新される", async () => {
    const changeRole = vi.fn().mockResolvedValue({ ...alice, role: "ADMIN" });
    renderWith({ listUsers: vi.fn().mockResolvedValue([admin, alice]), changeRole });
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("alice の権限"), "ADMIN");

    expect(changeRole).toHaveBeenCalledWith(2, "ADMIN");
    expect(screen.getByLabelText("alice の権限")).toHaveValue("ADMIN");
  });

  test("一般ユーザーが開くと管理者専用である旨を表示する", async () => {
    renderWith({
      listUsers: vi.fn().mockRejectedValue({ isAxiosError: true, response: { status: 403, data: {} } }),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await screen.findByText("この画面は管理者だけが使えます。")).toBeInTheDocument();
  });
});
