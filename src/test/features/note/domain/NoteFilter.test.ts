import { Note, NoteFilterCriteria } from "features/note/types/types";
import {
  emptyFilterCriteria,
  filterNotes,
} from "features/note/logic";

const noteOf = (id: number, overrides: Partial<Note> = {}): Note => ({
  id,
  title: `メモ${id}`,
  content: "本文",
  createdAt: "2025-01-01T00:00:00",
  ...overrides,
});

const criteria = (
  overrides: Partial<NoteFilterCriteria> = {}
): NoteFilterCriteria => ({ ...emptyFilterCriteria, ...overrides });

const idsOf = (notes: Note[]): number[] => notes.map((note) => note.id);

describe("filterNotes - 重要度", () => {
  const notes = [
    noteOf(1),
    noteOf(2, { isPinned: true }),
    noteOf(3, { isImportant: true }),
    noteOf(4, { isPinned: true, isImportant: true }),
  ];

  test("既定では絞り込まない", () => {
    expect(idsOf(filterNotes(notes, criteria()))).toEqual([1, 2, 3, 4]);
  });

  test("onlyPinned はピン留めだけを残す", () => {
    expect(idsOf(filterNotes(notes, criteria({ onlyPinned: true })))).toEqual([
      2, 4,
    ]);
  });

  test("onlyPinned と onlyImportant は AND で効く", () => {
    expect(
      idsOf(
        filterNotes(notes, criteria({ onlyPinned: true, onlyImportant: true }))
      )
    ).toEqual([4]);
  });
});

describe("filterNotes - 完了状態", () => {
  const notes = [noteOf(1, { isCompleted: true }), noteOf(2)];

  test("両方 ON なら全件", () => {
    expect(idsOf(filterNotes(notes, criteria()))).toEqual([1, 2]);
  });

  test("完了のみ ON なら完了済みだけ", () => {
    expect(
      idsOf(filterNotes(notes, criteria({ includeUncompleted: false })))
    ).toEqual([1]);
  });

  test("未完了のみ ON なら未完了だけ", () => {
    expect(
      idsOf(filterNotes(notes, criteria({ includeCompleted: false })))
    ).toEqual([2]);
  });

  test("両方 OFF のときは仕様通り全件を返す", () => {
    expect(
      idsOf(
        filterNotes(
          notes,
          criteria({ includeCompleted: false, includeUncompleted: false })
        )
      )
    ).toEqual([1, 2]);
  });
});

describe("filterNotes - キーワード", () => {
  const notes = [
    noteOf(1, { title: "会議の準備", content: "資料を作成する" }),
    noteOf(2, { title: "買い物", content: "Milk を買う" }),
  ];

  test("タイトルの部分一致で絞り込む", () => {
    expect(idsOf(filterNotes(notes, criteria({ searchQuery: "会議" })))).toEqual(
      [1]
    );
  });

  test("本文の部分一致でも絞り込む", () => {
    expect(idsOf(filterNotes(notes, criteria({ searchQuery: "資料" })))).toEqual(
      [1]
    );
  });

  test("大文字小文字を区別しない", () => {
    expect(idsOf(filterNotes(notes, criteria({ searchQuery: "milk" })))).toEqual(
      [2]
    );
  });

  test("一致しなければ 0 件", () => {
    expect(filterNotes(notes, criteria({ searchQuery: "存在しない" }))).toEqual(
      []
    );
  });
});

describe("filterNotes - タグ", () => {
  const notes = [
    noteOf(1, { tags: "仕事,勉強" }),
    noteOf(2, { tags: "仕事" }),
    noteOf(3),
  ];

  test("空なら絞り込まない", () => {
    expect(idsOf(filterNotes(notes, criteria({ tags: [] })))).toEqual([1, 2, 3]);
  });

  test("指定したタグをすべて持つメモだけを残す", () => {
    expect(idsOf(filterNotes(notes, criteria({ tags: ["仕事"] })))).toEqual([
      1, 2,
    ]);
    expect(
      idsOf(filterNotes(notes, criteria({ tags: ["仕事", "勉強"] })))
    ).toEqual([1]);
  });

  test("タグが未設定のメモは絞り込み時に残らない", () => {
    expect(idsOf(filterNotes(notes, criteria({ tags: ["仕事"] })))).not.toContain(
      3
    );
  });
});

describe("filterNotes - 条件の組み合わせ", () => {
  test("すべての条件を同時に満たすものだけが残る", () => {
    const notes = [
      noteOf(1, { title: "会議", tags: "仕事", isPinned: true }),
      noteOf(2, { title: "会議", tags: "仕事" }),
      noteOf(3, { title: "会議", tags: "私用", isPinned: true }),
    ];

    expect(
      idsOf(
        filterNotes(
          notes,
          criteria({ searchQuery: "会議", tags: ["仕事"], onlyPinned: true })
        )
      )
    ).toEqual([1]);
  });
});
