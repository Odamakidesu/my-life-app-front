import React from "react";
import { Route, Routes } from "react-router-dom";
import { ThemeName } from "shared/types/theme";
import RequireAuth from "features/auth/components/RequireAuth";
import LoginPage from "features/auth";
import RegisterPage from "features/auth/RegisterPage";
import NotesPage from "features/note";
import TrashPage from "features/note/TrashPage";
import TagsPage from "features/tag";

type AppRoutesProps = {
  theme: ThemeName;
};

/** 画面遷移の定義 */
const AppRoutes: React.FC<AppRoutesProps> = ({ theme }) => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/notes"
      element={
        <RequireAuth>
          <NotesPage theme={theme} />
        </RequireAuth>
      }
    />
    <Route
      path="/trash"
      element={
        <RequireAuth>
          <TrashPage theme={theme} />
        </RequireAuth>
      }
    />
    <Route
      path="/tags"
      element={
        <RequireAuth>
          <TagsPage theme={theme} />
        </RequireAuth>
      }
    />
  </Routes>
);

export default AppRoutes;
