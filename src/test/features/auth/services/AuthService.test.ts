import { AuthService } from "features/auth/services/AuthService";
import { AuthRepository, TokenStorage } from "features/auth/types/types";
import { PasswordChangeValidationError } from "features/auth/types/schema";

const storageWith = (token: string | null) => {
  let current = token;
  const storage: TokenStorage = {
    save: vi.fn((value: string) => {
      current = value;
    }),
    load: vi.fn(() => current),
    clear: vi.fn(() => {
      current = null;
    }),
  };
  return storage;
};

const repositoryWith = (overrides: Partial<AuthRepository>) =>
  ({
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    changePassword: vi.fn(),
    currentUser: vi.fn(),
    ...overrides,
  }) as AuthRepository;

describe("AuthService#logout", () => {
  test("サーバでトークンを無効にしてから手元のトークンを破棄する", async () => {
    const storage = storageWith("token");
    const repository = repositoryWith({});

    await new AuthService(repository, storage).logout();

    expect(repository.logout).toHaveBeenCalled();
    expect(storage.load()).toBeNull();
  });

  test("サーバへの要求が失敗しても手元のトークンは破棄する", async () => {
    const storage = storageWith("token");
    const repository = repositoryWith({ logout: vi.fn().mockRejectedValue(new Error("offline")) });

    await new AuthService(repository, storage).logout();

    expect(storage.load()).toBeNull();
  });

  test("トークンが無ければサーバへは送らない", async () => {
    const repository = repositoryWith({});

    await new AuthService(repository, storageWith(null)).logout();

    expect(repository.logout).not.toHaveBeenCalled();
  });
});

describe("AuthService#changePassword", () => {
  const input = {
    currentPassword: "old-password-1234",
    newPassword: "new-password-5678",
    newPasswordConfirmation: "new-password-5678",
  };

  test("返された新しいトークンに差し替える", async () => {
    const storage = storageWith("old-token");
    const repository = repositoryWith({ changePassword: vi.fn().mockResolvedValue("new-token") });

    await new AuthService(repository, storage).changePassword(input);

    expect(repository.changePassword).toHaveBeenCalledWith("old-password-1234", "new-password-5678");
    expect(storage.load()).toBe("new-token");
  });

  test("確認用が一致しなければ送らずに例外を投げる", async () => {
    const repository = repositoryWith({});

    await expect(
      new AuthService(repository, storageWith("t")).changePassword({
        ...input,
        newPasswordConfirmation: "different-password",
      })
    ).rejects.toBeInstanceOf(PasswordChangeValidationError);
    expect(repository.changePassword).not.toHaveBeenCalled();
  });
});
