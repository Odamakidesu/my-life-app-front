import { useCallback, useEffect, useState } from "react";
import { themeStorage } from "infrastructure/storage/themeStorage";
import { ThemeName } from "shared/types/theme";

/**
 * アプリ全体のテーマ（ライト／ダーク）を管理するフック。
 * 保存先の詳細は infrastructure 層の themeStorage に委譲する。
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(
    () => themeStorage.load() ?? "light"
  );

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
    themeStorage.save(theme); // 保存
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return { theme, toggleTheme };
};
