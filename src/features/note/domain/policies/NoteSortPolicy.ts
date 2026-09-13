import { Note } from "features/note/domain/types/Note";

/**
 * メモの表示順を決めるドメインポリシー。
 * ピン留め > スター（重要） > 作成日時の新しい順。
 */
export const compareByPriority = (a: Note, b: Note): number => {
  if ((a.isPinned ? 1 : 0) !== (b.isPinned ? 1 : 0)) {
    return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
  }
  if ((a.isImportant ? 1 : 0) !== (b.isImportant ? 1 : 0)) {
    return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
  }
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

/** 優先度ポリシーに従って並べ替えた新しい配列を返す */
export const sortByPriority = (notes: Note[]): Note[] =>
  [...notes].sort(compareByPriority);
