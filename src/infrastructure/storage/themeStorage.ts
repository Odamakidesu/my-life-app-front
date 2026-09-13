import { ThemeName } from "shared/types/theme";

const THEME_KEY = "theme";

/** テーマ設定の保存・復元（技術詳細） */
export const themeStorage = {
  load(): ThemeName | null {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  },
  save(theme: ThemeName): void {
    localStorage.setItem(THEME_KEY, theme);
  },
};
