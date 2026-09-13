import { Note } from "features/note/types/types";
import {
  deadlineStatusOf,
  tagNamesOf,
  toTagString,
} from "features/note/logic";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2025-06-15T12:00:00Z");

const noteWithDeadline = (deadline?: string): Note => ({
  id: 1,
  title: "メモ",
  content: "本文",
  createdAt: "2025-01-01T00:00:00",
  deadline,
});

describe("deadlineStatusOf", () => {
  test("締切が未設定なら none", () => {
    expect(deadlineStatusOf(noteWithDeadline(), NOW)).toBe("none");
  });

  test("締切を過ぎていれば overdue", () => {
    const past = new Date(NOW.getTime() - 1000).toISOString();

    expect(deadlineStatusOf(noteWithDeadline(past), NOW)).toBe("overdue");
  });

  test("24 時間以内なら dueSoon", () => {
    const soon = new Date(NOW.getTime() + ONE_DAY_MS - 1000).toISOString();

    expect(deadlineStatusOf(noteWithDeadline(soon), NOW)).toBe("dueSoon");
  });

  test("ちょうど 24 時間後は dueSoon に含む（境界）", () => {
    const boundary = new Date(NOW.getTime() + ONE_DAY_MS).toISOString();

    expect(deadlineStatusOf(noteWithDeadline(boundary), NOW)).toBe("dueSoon");
  });

  test("24 時間を超えていれば scheduled", () => {
    const later = new Date(NOW.getTime() + ONE_DAY_MS + 1000).toISOString();

    expect(deadlineStatusOf(noteWithDeadline(later), NOW)).toBe("scheduled");
  });

  test("基準時刻を省略すると現在時刻で判定する", () => {
    const past = new Date(Date.now() - ONE_DAY_MS).toISOString();

    expect(deadlineStatusOf(noteWithDeadline(past))).toBe("overdue");
  });
});

describe("tagNamesOf", () => {
  test("カンマ区切りを配列に分解し前後の空白を落とす", () => {
    const note = { ...noteWithDeadline(), tags: " 仕事 , 勉強 " };

    expect(tagNamesOf(note)).toEqual(["仕事", "勉強"]);
  });

  test("空要素は取り除く", () => {
    const note = { ...noteWithDeadline(), tags: "仕事,, ,勉強" };

    expect(tagNamesOf(note)).toEqual(["仕事", "勉強"]);
  });

  test("タグが未設定なら空配列", () => {
    expect(tagNamesOf(noteWithDeadline())).toEqual([]);
  });
});

describe("toTagString", () => {
  test("配列をカンマ区切りにする", () => {
    expect(toTagString(["仕事", "勉強"])).toBe("仕事,勉強");
  });

  test("空白のみの要素は落とす", () => {
    expect(toTagString([" 仕事 ", "  ", "勉強"])).toBe("仕事,勉強");
  });

  test("空配列なら空文字", () => {
    expect(toTagString([])).toBe("");
  });
});
