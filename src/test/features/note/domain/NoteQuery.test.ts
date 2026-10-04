import {
  completedFilterOf,
  daysUntilPurge,
  emptyFilterOptions,
  toNoteQuery,
} from "features/note/logic";

describe("completedFilterOf", () => {
  test("片方だけ ON ならそれに絞り、両方 ON・両方 OFF は絞り込まない", () => {
    const of = (includeCompleted: boolean, includeUncompleted: boolean) =>
      completedFilterOf({ ...emptyFilterOptions, includeCompleted, includeUncompleted });

    expect(of(true, false)).toBe(true);
    expect(of(false, true)).toBe(false);
    expect(of(true, true)).toBeUndefined();
    expect(of(false, false)).toBeUndefined();
  });
});

describe("toNoteQuery", () => {
  test("画面の絞り込み状態を検索条件にまとめる", () => {
    expect(
      toNoteQuery(
        { ...emptyFilterOptions, tags: ["仕事"], onlyPinned: true, includeCompleted: false },
        "会議",
        "DEADLINE",
        "SOON"
      )
    ).toEqual({
      keyword: "会議",
      tags: ["仕事"],
      onlyPinned: true,
      onlyImportant: false,
      completed: false,
      due: "SOON",
      sort: "DEADLINE",
    });
  });
});

describe("daysUntilPurge", () => {
  const now = new Date("2026-10-04T12:00:00");

  test("ゴミ箱に入れてから30日後までの残り日数（切り上げ）", () => {
    expect(daysUntilPurge("2026-10-04T12:00:00", now)).toBe(30);
    expect(daysUntilPurge("2026-09-04T13:00:00", now)).toBe(1);
    expect(daysUntilPurge("2026-09-01T00:00:00", now)).toBeLessThanOrEqual(0);
  });

  test("削除日時が無ければ null", () => {
    expect(daysUntilPurge(undefined, now)).toBeNull();
  });
});
