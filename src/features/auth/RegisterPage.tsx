import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "features/auth/hooks/useRegister";
import {
  Registration,
  emptyRegistration,
  registrationSchema,
} from "features/auth/types/schema";

/** 新規登録画面。登録に成功したらそのままログインしてメモ画面へ進む */
const RegisterPage: React.FC = () => {
  const { error, register: registerUser } = useRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Registration>({
    resolver: zodResolver(registrationSchema),
    defaultValues: emptyRegistration,
  });

  const onSubmit = async (registration: Registration) => {
    const succeeded = await registerUser(registration);
    if (succeeded) {
      navigate("/notes");
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
        <h2 className="text-center mb-4">新規登録</h2>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="register-username" className="form-label">
            ユーザー名
          </label>
          <input
            type="text"
            className={`form-control ${errors.username ? "is-invalid" : ""}`}
            id="register-username"
            placeholder="英数字と _ . - の3〜50文字"
            autoComplete="username"
            {...register("username")}
          />
          {errors.username && (
            <div className="invalid-feedback">{errors.username.message}</div>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="register-password" className="form-label">
            パスワード
          </label>
          <input
            type="password"
            className={`form-control ${errors.password ? "is-invalid" : ""}`}
            id="register-password"
            placeholder="12文字以上"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password.message}</div>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="register-password-confirmation" className="form-label">
            パスワード（確認）
          </label>
          <input
            type="password"
            className={`form-control ${errors.passwordConfirmation ? "is-invalid" : ""}`}
            id="register-password-confirmation"
            placeholder="もう一度入力"
            autoComplete="new-password"
            {...register("passwordConfirmation")}
          />
          {errors.passwordConfirmation && (
            <div className="invalid-feedback">
              {errors.passwordConfirmation.message}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mb-3"
          disabled={isSubmitting}
        >
          登録する
        </button>

        <p className="text-center mb-0">
          アカウントをお持ちの方は <Link to="/">ログイン</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
