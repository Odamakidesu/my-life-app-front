import React from "react";
import { ThemeName } from "shared/types/theme";

type ThemeToggleProps = {
  theme: ThemeName;
  onToggle: () => void;
};

/** ライト／ダークテーマの切り替えスイッチ */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => (
  <div className="mb-4 d-flex justify-content-end align-items-center">
    <span className="me-2">{theme === "light" ? "☀️" : "🌙"}</span>
    <div
      className="theme-toggle-switch"
      onClick={onToggle}
      role="button"
      aria-label="Toggle Theme"
    >
      <div className={`switch-knob ${theme === "dark" ? "switch-on" : ""}`} />
    </div>
  </div>
);

export default ThemeToggle;
