import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NotesPage from "./pages/NotesPage";
import LoginForm from "./pages/LoginForm";
import RequireAuth from "./components/RequireAuth";
import "./App.css";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  useEffect(() => {
    document.body.className = ""; // 一度リセット
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem("theme", theme); // 保存
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  return (
    <div className={`container ${theme}-theme`}>
      <div className="mb-4 d-flex justify-content-end align-items-center">
        <span className="me-2">{theme === "light" ? "☀️" : "🌙"}</span>
        <div
          className="theme-toggle-switch"
          onClick={toggleTheme}
          role="button"
          aria-label="Toggle Theme"
        >
          <div
            className={`switch-knob ${theme === "dark" ? "switch-on" : ""}`}
          />
        </div>
      </div>

      <Router>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route
            path="/notes"
            element={
              <RequireAuth>
                <NotesPage theme={theme} />
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
