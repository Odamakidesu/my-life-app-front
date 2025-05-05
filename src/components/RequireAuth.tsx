import React from "react";
import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

type Props = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<Props> = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token || !isTokenValid(token)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireAuth;
