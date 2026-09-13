import { DeadlineStatus, Note } from "features/note/domain/types/Note";

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
