import { isTokenValid } from "features/auth/logic";

/** 署名は検証されないため、ペイロードだけが意味を持つ JWT 風の文字列を組む */
const tokenWithPayload = (payload: Record<string, unknown>): string =>
  `header.${btoa(JSON.stringify(payload))}.signature`;

const secondsFromNow = (seconds: number): number =>
  Math.floor(Date.now() / 1000) + seconds;

describe("isTokenValid", () => {
  test("有効期限が未来なら true", () => {
    expect(isTokenValid(tokenWithPayload({ exp: secondsFromNow(3600) }))).toBe(
      true
    );
  });

  test("有効期限が過去なら false", () => {
    expect(isTokenValid(tokenWithPayload({ exp: secondsFromNow(-1) }))).toBe(
      false
    );
  });

  test("JWT の形をしていなければ false", () => {
    expect(isTokenValid("not-a-token")).toBe(false);
  });

  test("ペイロードが JSON でなければ false", () => {
    expect(isTokenValid("header.****.signature")).toBe(false);
  });

  test("localStorage に文字列 undefined が入っていても落ちない", () => {
    expect(isTokenValid("undefined")).toBe(false);
  });

  // exp が無い場合、実装は payload.exp をそのまま返すため undefined になる。
  // 宣言上の戻り値 boolean とは食い違うが、判定としては安全側（未認証）に倒れる。
  test("exp が無ければ有効と見なさない", () => {
    expect(isTokenValid(tokenWithPayload({ sub: "taro" }))).toBeFalsy();
  });
});
