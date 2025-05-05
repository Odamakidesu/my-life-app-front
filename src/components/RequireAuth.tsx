// components/RequireAuth.tsx
import React from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;
