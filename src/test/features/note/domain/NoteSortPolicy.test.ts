import { Note } from "features/note/domain/types/Note";
import {
  compareByPriority,
  sortByPriority,
} from "features/note/domain/policies/NoteSortPolicy";

const noteOf = (id: number, overrides: Partial<Note> = {}): Note => ({
  id,
  title: `メモ${id}`,
  content: "本文",
  createdAt: "2025-01-01T00:00:00",
  ...overrides,
});

describe("compareByPriority", () => {
  test("ピン留めは重要より優先される", () => {
    const pinned = noteOf(1, { isPinned: true });
    const important = noteOf(2, { isImportant: true });

    expect(compareByPriority(pinned, important)).toBeLessThan(0);
    expect(compareByPriority(important, pinned)).toBeGreaterThan(0);
  });

  test("ピン留めが同条件なら重要が優先される", () => {
    const important = noteOf(1, { isPinned: true, isImportant: true });
    const plain = noteOf(2, { isPinned: true });

    expect(compareByPriority(important, plain)).toBeLessThan(0);
  });

  test("ピン留めも重要も同条件なら作成日時の新しい順", () => {
    const older = noteOf(1, { createdAt: "2025-01-01T00:00:00" });
    const newer = noteOf(2, { createdAt: "2025-06-01T00:00:00" });

    expect(compareByPriority(newer, older)).toBeLessThan(0);
    expect(compareByPriority(older, newer)).toBeGreaterThan(0);
  });

  test("未設定のフラグは false と同じ扱いになる", () => {
    const undefinedFlag = noteOf(1, { createdAt: "2025-01-01T00:00:00" });
    const explicitFalse = noteOf(2, {
      isPinned: false,
      isImportant: false,
      createdAt: "2025-01-01T00:00:00",
    });

    expect(compareByPriority(undefinedFlag, explicitFalse)).toBe(0);
  });
});

describe("sortByPriority", () => {
  test("ピン留め > 重要 > 作成日時の新しい順に並ぶ", () => {
    const notes = [
      noteOf(1, { createdAt: "2025-01-01T00:00:00" }),
      noteOf(2, { isImportant: true }),
      noteOf(3, { isPinned: true }),
      noteOf(4, { createdAt: "2025-09-01T00:00:00" }),
    ];

    expect(sortByPriority(notes).map((note) => note.id)).toEqual([3, 2, 4, 1]);
  });

  test("元の配列を書き換えない", () => {
    const notes = [noteOf(1), noteOf(2, { isPinned: true })];
    const original = [...notes];

    sortByPriority(notes);

    expect(notes).toEqual(original);
  });
});
