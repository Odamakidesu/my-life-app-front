import React from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeName } from "shared/types/theme";
import RequireAuth from "features/auth/components/RequireAuth";
import LoginPage from "features/auth";
import NotesPage from "features/note";

type AppRoutesProps = {
  theme: ThemeName;
};

/** 画面遷移の定義 */
const AppRoutes: React.FC<AppRoutesProps> = ({ theme }) => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route
      path="/notes"
      element={
        <RequireAuth>
          <NotesPage theme={theme} />
        </RequireAuth>
      }
    />
  </Routes>
);

export default AppRoutes;
