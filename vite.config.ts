/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { legacyProcessEnvWarning, migrateLegacyEnv } from "./config/migrateLegacyEnv";

/** `src` 直下のディレクトリを起点にした絶対インポート（tsconfig.json の paths と対応） */
const srcAlias = (dir: string) => ({
  find: new RegExp(`^${dir}/`),
  replacement: fileURLToPath(new URL(`./src/${dir}/`, import.meta.url)),
});

// CRA 時代の REACT_APP_* が手元の .env.*local に残っていたら、Vite が env を読む前に改名する
for (const file of migrateLegacyEnv(fileURLToPath(new URL(".", import.meta.url)))) {
  console.warn(`[env] ${file} の REACT_APP_API_BASE_URL を VITE_API_BASE_URL に書き換えました`);
}
const envWarning = legacyProcessEnvWarning(process.env);
if (envWarning) console.warn(`[env] ${envWarning}`);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: ["app", "assets", "features", "infrastructure", "shared"].map(srcAlias),
  },
  server: {
    // バックエンドの CORS 許可オリジンが http://localhost:5173 だけのため固定する。
    // 使用中なら別ポートへ逃げずに失敗させる（逃げると CORS で弾かれて原因が分かりにくい）。
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // デプロイジョブ（.github/workflows/frontend.yml）が ./build を S3 へ同期するため、
    // CRA 時代と同じ出力先を維持する。
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    include: ["src/test/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/**/*.d.ts"],
    },
  },
});
