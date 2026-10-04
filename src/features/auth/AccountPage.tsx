import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useChangePassword } from "features/auth/hooks/useChangePassword";
import { useCurrentUser } from "features/auth/hooks/useAuth";
import {
  PasswordChangeInput,
  emptyPasswordChange,
  passwordChangeSchema,
} from "features/auth/types/schema";
import { ThemeName } from "shared/types/theme";

type AccountPageProps = {
  theme: ThemeName;
};

type PasswordField = {
  name: keyof PasswordChangeInput;
  label: string;
  autoComplete: string;
};

const FIELDS: PasswordField[] = [
  { name: "currentPassword", label: "現在のパスワード", autoComplete: "current-password" },
  { name: "newPassword", label: "新しいパスワード（12文字以上）", autoComplete: "new-password" },
  { name: "newPasswordConfirmation", label: "新しいパスワード（確認）", autoComplete: "new-password" },
];

/** アカウント画面。パスワードを変更する */
const AccountPage: React.FC<AccountPageProps> = ({ theme }) => {
  const user = useCurrentUser();
  const { error, changePassword } = useChangePassword();
  const [completed, setCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: emptyPasswordChange,
  });

  const onSubmit = async (input: PasswordChangeInput) => {
    setCompleted(false);
    if (await changePassword(input)) {
      reset(emptyPasswordChange);
      setCompleted(true);
    }
  };

  return (
    <div className="container mt-4" data-bs-theme={theme} style={{ maxWidth: "560px" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">アカウント</h2>
        <Link to="/notes" className="btn btn-outline-primary">
          メモ一覧へ戻る
        </Link>
      </div>

      {user && (
        <p className="text-body-secondary">
          ユーザー名: <strong>{user.username}</strong>
        </p>
      )}

      <form className="card shadow-sm p-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <h5 className="mb-3">パスワードの変更</h5>
        <p className="small text-body-secondary">
          変更すると、ほかの端末でのログインはすべて解除されます。
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {completed && (
          <div className="alert alert-success" role="status">
            パスワードを変更しました。
          </div>
        )}

        {FIELDS.map((field) => (
          <div className="mb-3" key={field.name}>
            <label htmlFor={`account-${field.name}`} className="form-label">
              {field.label}
            </label>
            <input
              type="password"
              id={`account-${field.name}`}
              className={`form-control ${errors[field.name] ? "is-invalid" : ""}`}
              autoComplete={field.autoComplete}
              {...register(field.name)}
            />
            {errors[field.name] && (
              <div className="invalid-feedback">{errors[field.name]?.message}</div>
            )}
          </div>
        ))}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "変更中..." : "パスワードを変更"}
        </button>
      </form>
    </div>
  );
};

export default AccountPage;
