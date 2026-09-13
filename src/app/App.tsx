import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "app/routes/AppRoutes";
import SessionExpiryWatcher from "app/components/SessionExpiryWatcher";
import { useTheme } from "app/hooks/useTheme";
import ThemeToggle from "shared/components/ThemeToggle";
import "shared/styles/App.css";

/** アプリケーションのルートコンポーネント（起動と横断的な設定のみを担う） */
function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {/* v7 で既定になる挙動を先取りして有効化しておく */}
      <Router
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        {/* 通信層からのセッション失効通知を受けて退避させる（表示は持たない） */}
        <SessionExpiryWatcher />
        <AppRoutes theme={theme} />
      </Router>
    </div>
  );
}

export default App;
