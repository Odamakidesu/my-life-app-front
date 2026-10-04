import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { legacyProcessEnvWarning, migrateLegacyEnv } from "../../../config/migrateLegacyEnv";

describe("migrateLegacyEnv", () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "env-"));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it("CRA 時代の変数名を VITE_ に書き換える", () => {
    writeFileSync(join(root, ".env.local"), "# comment\nREACT_APP_API_BASE_URL=http://localhost:8081/api\nOTHER=1\n");

    expect(migrateLegacyEnv(root)).toEqual([".env.local"]);
    expect(readFileSync(join(root, ".env.local"), "utf8")).toBe(
      "# comment\nVITE_API_BASE_URL=http://localhost:8081/api\nOTHER=1\n",
    );
  });

  it("新しい名前が既にあれば古い行をコメントアウトし、新しい値を優先する", () => {
    writeFileSync(
      join(root, ".env.development.local"),
      "REACT_APP_API_BASE_URL=http://old/api\nVITE_API_BASE_URL=http://new/api\n",
    );

    expect(migrateLegacyEnv(root)).toEqual([".env.development.local"]);
    expect(readFileSync(join(root, ".env.development.local"), "utf8")).toBe(
      "# REACT_APP_API_BASE_URL=http://old/api  # VITE_API_BASE_URL に移行済み\nVITE_API_BASE_URL=http://new/api\n",
    );
  });

  it("古い名前が無ければファイルに触れない", () => {
    writeFileSync(join(root, ".env.local"), "VITE_API_BASE_URL=http://x/api\n");

    expect(migrateLegacyEnv(root)).toEqual([]);
    expect(readFileSync(join(root, ".env.local"), "utf8")).toBe("VITE_API_BASE_URL=http://x/api\n");
  });

  it("コミット対象の .env.development は書き換えない", () => {
    writeFileSync(join(root, ".env.development"), "REACT_APP_API_BASE_URL=http://x/api\n");

    expect(migrateLegacyEnv(root)).toEqual([]);
  });

  it("2回実行しても結果が変わらない", () => {
    writeFileSync(join(root, ".env.local"), "REACT_APP_API_BASE_URL=http://x/api\n");
    migrateLegacyEnv(root);

    expect(migrateLegacyEnv(root)).toEqual([]);
  });
});

describe("legacyProcessEnvWarning", () => {
  it("シェルに古い名前だけがある時に警告する", () => {
    expect(legacyProcessEnvWarning({ REACT_APP_API_BASE_URL: "x" })).toContain("VITE_API_BASE_URL");
  });

  it("新しい名前もあれば警告しない", () => {
    expect(legacyProcessEnvWarning({ REACT_APP_API_BASE_URL: "x", VITE_API_BASE_URL: "y" })).toBeUndefined();
  });
});
