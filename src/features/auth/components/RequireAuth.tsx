import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "features/auth/hooks/useAuth";

type Props = {
  children: React.ReactElement;
};

/** 認証済みでなければログイン画面へ退避させるルートガード */
const RequireAuth: React.FC<Props> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
