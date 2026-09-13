import {
  DeadlineStatus,
  Note,
  NoteFilterCriteria,
  NoteFilterOptions,
} from "features/note/types/types";

/** メモそのものが持つ、UI にも API にも依存しない判断ロジック */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * メモの締切状態を判定する。
 * @param note 対象のメモ
 * @param now 判定基準時刻（既定は現在時刻）
 */
export const deadlineStatusOf = (
  note: Note,
  now: Date = new Date()
): DeadlineStatus => {
  if (!note.deadline) return "none";

  const remaining = new Date(note.deadline).getTime() - now.getTime();
  if (remaining < 0) return "overdue";
  if (remaining <= ONE_DAY_MS) return "dueSoon";
  return "scheduled";
};

/** メモが持つタグ名を正規化して取り出す */
export const tagNamesOf = (note: Note): string[] =>
  (note.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

/** タグ名の配列を、永続化で用いるカンマ区切り文字列に変換する */
export const toTagString = (tagNames: string[]): string =>
  tagNames
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "")
    .join(",");

export const emptyFilterOptions: NoteFilterOptions = {
  tags: [],
  onlyPinned: false,
  onlyImportant: false,
  includeCompleted: true,
  includeUncompleted: true,
};

export const emptyFilterCriteria: NoteFilterCriteria = {
  ...emptyFilterOptions,
  searchQuery: "",
};

const matchesImportance = (note: Note, criteria: NoteFilterCriteria): boolean =>
  (criteria.onlyPinned ? !!note.isPinned : true) &&
  (criteria.onlyImportant ? !!note.isImportant : true);

const matchesCompletion = (note: Note, criteria: NoteFilterCriteria): boolean => {
  const { includeCompleted, includeUncompleted } = criteria;
  if (includeCompleted && includeUncompleted) return true;
  if (includeCompleted) return !!note.isCompleted;
  if (includeUncompleted) return !note.isCompleted;
  return true;
};

const matchesKeyword = (note: Note, criteria: NoteFilterCriteria): boolean => {
  const query = criteria.searchQuery.toLowerCase();
  return (
    note.title.toLowerCase().includes(query) ||
    note.content.toLowerCase().includes(query)
  );
};

const matchesTags = (note: Note, criteria: NoteFilterCriteria): boolean => {
  if (criteria.tags.length === 0) return true;
  if (!note.tags) return false;

  const names = tagNamesOf(note).map((tag) => tag.toLowerCase());
  return criteria.tags.every((selected) =>
    names.some((name) => name === selected.toLowerCase())
  );
};

export const filterNotes = (
  notes: Note[],
  criteria: NoteFilterCriteria
): Note[] =>
  notes.filter(
    (note) =>
      matchesImportance(note, criteria) &&
      matchesCompletion(note, criteria) &&
      matchesKeyword(note, criteria) &&
      matchesTags(note, criteria)
  );

export const compareByPriority = (a: Note, b: Note): number => {
  if ((a.isPinned ? 1 : 0) !== (b.isPinned ? 1 : 0)) {
    return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
  }
  if ((a.isImportant ? 1 : 0) !== (b.isImportant ? 1 : 0)) {
    return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

export const sortByPriority = (notes: Note[]): Note[] =>
  [...notes].sort(compareByPriority);
