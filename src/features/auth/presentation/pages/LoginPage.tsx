import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useLogin } from "features/auth/application/hooks/useLogin";
import {
  Credentials,
  credentialsSchema,
  emptyCredentials,
} from "features/auth/domain/schemas/CredentialsSchema";

/** ログイン画面 */
const LoginPage: React.FC = () => {
  const { error, login } = useLogin();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: emptyCredentials,
  });

  const onSubmit = async (credentials: Credentials) => {
    const succeeded = await login(credentials);
    if (succeeded) {
      navigate("/notes"); // ログイン後の遷移先
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <form
        className="card shadow-sm p-4"
        style={{ maxWidth: "400px", width: "100%" }}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h2 className="text-center mb-4">ログイン</h2>

        {/* 認証そのものの失敗（サーバー応答） */}
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            ユーザー名
          </label>
          <input
            type="text"
            className={`form-control ${errors.username ? "is-invalid" : ""}`}
            id="username"
            placeholder="ユーザー名を入力"
            autoComplete="username"
            {...register("username")}
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            パスワード
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            id="password"
            placeholder="パスワードを入力"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password.message}</div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={isSubmitting}
        >
          ログイン
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
