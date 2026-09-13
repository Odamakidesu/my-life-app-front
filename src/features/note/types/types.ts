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

/**
 * 新規メモの作成に必要な入力値。
 *
 * createdAt は持たない。作成日時と所有者はサーバが決めるため、
 * クライアントが送っても無視される。
 */
export type NewNote = {
  title: string;
  content: string;
  tags: string;
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

export type NoteFilterOptions = {
  tags: string[];
  onlyPinned: boolean;
  onlyImportant: boolean;
  includeCompleted: boolean;
  includeUncompleted: boolean;
};

export type NoteFilterCriteria = NoteFilterOptions & {
  searchQuery: string;
};

export interface NoteRepository {
  findAll(): Promise<Note[]>;
  create(note: NewNote): Promise<Note>;
  update(id: NoteId, note: NoteEdit): Promise<void>;
  updateImportant(id: NoteId, isImportant: boolean): Promise<void>;
  updatePinned(id: NoteId, isPinned: boolean): Promise<void>;
  updateCompleted(id: NoteId, isCompleted: boolean): Promise<void>;
  markAsDeleted(id: NoteId): Promise<void>;
}
