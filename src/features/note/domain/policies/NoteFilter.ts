import { tagNamesOf } from "features/note/domain/policies/NotePolicy";
import { Note } from "features/note/domain/types/Note";

/**
 * キーワード以外の絞り込み条件。
 * 検索キーワードは入力のたびに変わり再描画の性質が異なるため、
 * 画面側で別の state として持てるよう型を分けている。
 */
export type NoteFilterOptions = {
  /** 指定したタグをすべて持つメモだけを残す（空なら絞り込まない） */
  tags: string[];
  onlyPinned: boolean;
  onlyImportant: boolean;
  includeCompleted: boolean;
  includeUncompleted: boolean;
};

/** メモ一覧の絞り込み条件 */
export type NoteFilterCriteria = NoteFilterOptions & {
  /** タイトル・本文に対する部分一致検索 */
  searchQuery: string;
};

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

const matchesImportance = (note: Note, criteria: NoteFilterCriteria): boolean => {
  const matchesPinned = criteria.onlyPinned ? !!note.isPinned : true;
  const matchesImportant = criteria.onlyImportant ? !!note.isImportant : true;
  return matchesPinned && matchesImportant;
};

const matchesCompletion = (note: Note, criteria: NoteFilterCriteria): boolean => {
  const { includeCompleted, includeUncompleted } = criteria;
  if (includeCompleted && includeUncompleted) return true;
  if (includeCompleted) return !!note.isCompleted;
  if (includeUncompleted) return !note.isCompleted;
  // どちらも OFF のときは全件表示（仕様上）
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

/** 絞り込み条件に一致するメモだけを返す */
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
