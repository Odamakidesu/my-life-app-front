import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginForm: React.FC = () => {
  const API_URL = `${process.env.REACT_APP_API_BASE_URL}/auth/login`;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const res = await axios.post(
        API_URL,
        {
          username,
          password,
        },
        {
          withCredentials: true, // ← これがないと CORS で拒否される
        }
      );
      localStorage.setItem("token", res.data.token);
      setError("");
      navigate("/notes"); // ログイン後の遷移先
    } catch (err: any) {
      setError(
        "ログインに失敗しました。ユーザー名またはパスワードを確認してください。"
      );
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow-sm p-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <h2 className="text-center mb-4">ログイン</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label htmlFor="username" className="form-label">
            ユーザー名
          </label>
          <input
            type="text"
            className="form-control"
            id="username"
            placeholder="ユーザー名を入力"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="form-label">
            パスワード
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button onClick={handleLogin} className="btn btn-primary w-100">
          ログイン
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
