import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** CRA 時代の変数名 → Vite での変数名 */
const RENAMES: Record<string, string> = {
  REACT_APP_API_BASE_URL: "VITE_API_BASE_URL",
};

/** 端末ごとの上書きファイル（.gitignore 対象）。コミット済みのファイルは書き換えない */
const LOCAL_ENV_FILES = [
  ".env.local",
  ".env.development.local",
  ".env.production.local",
  ".env.test.local",
];

const definesKey = (text: string, key: string) =>
  new RegExp(`^\\s*(?:export\\s+)?${key}\\s*=`, "m").test(text);

/**
 * 手元の .env.*local に残った CRA 時代の変数名を Vite の名前へ書き換える。
 * Vite は `VITE_` で始まる変数しか読まないため、放置すると上書きが黙って無視され、
 * .env.development の既定値（localhost:8080）に繋がってしまう。
 * 新しい名前が既に書かれている行は残し、古い行はコメントアウトする。
 *
 * @returns 書き換えたファイル名
 */
export function migrateLegacyEnv(root: string): string[] {
  const changed: string[] = [];
  for (const name of LOCAL_ENV_FILES) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    const before = readFileSync(path, "utf8");
    let after = before;
    for (const [oldKey, newKey] of Object.entries(RENAMES)) {
      const oldLine = new RegExp(`^(\\s*(?:export\\s+)?)${oldKey}(?=\\s*=)`, "gm");
      after = definesKey(after, newKey)
        ? after.replace(new RegExp(`^(\\s*(?:export\\s+)?${oldKey}\\s*=.*)$`, "gm"), `# $1  # ${newKey} に移行済み`)
        : after.replace(oldLine, `$1${newKey}`);
    }
    if (after !== before) {
      writeFileSync(path, after);
      changed.push(name);
    }
  }
  return changed;
}

/** シェルの環境変数に古い名前が残っている時の警告文。無ければ undefined */
export function legacyProcessEnvWarning(env: NodeJS.ProcessEnv): string | undefined {
  const stale = Object.keys(RENAMES).filter((k) => env[k] !== undefined && env[RENAMES[k]] === undefined);
  if (stale.length === 0) return undefined;
  return `環境変数 ${stale.join(", ")} は読まれません。${stale.map((k) => RENAMES[k]).join(", ")} に名前を変えてください。`;
}
