import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "app/routes/AppRoutes";
import { useTheme } from "app/hooks/useTheme";
import ThemeToggle from "shared/components/ThemeToggle";
import "shared/styles/App.css";

/** アプリケーションのルートコンポーネント（起動と横断的な設定のみを担う） */
function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`container ${theme}-theme`}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* v7 で既定になる挙動を先取りして有効化しておく */}
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes theme={theme} />
      </Router>
    </div>
  );
}

export default App;
