/** メモ（Note）の型定義 */

export type NoteId = number;

/**
 * ドメインが扱うメモ。
 * API のフィールド名（スネークケース）や削除フラグといった永続化の都合は
 * infrastructure 層のスキーマで吸収し、ここには持ち込まない。
 */
export type Note = {
  id: NoteId;
  title: string;
  content: string;
  createdAt: string;
  tags?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  deadline?: string;
};

/** 新規メモの作成に必要な入力値 */
export type NewNote = {
  title: string;
  content: string;
  tags: string;
  createdAt: string;
  deadline?: string | null;
};

/** 既存メモの更新に必要な入力値 */
export type NoteEdit = {
  title: string;
  content: string;
  tags: string;
  deadline: string;
};

/** 締切の状態 */
export type DeadlineStatus = "none" | "overdue" | "dueSoon" | "scheduled";
