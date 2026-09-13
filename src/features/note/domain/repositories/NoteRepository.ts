import { NewNote, Note, NoteEdit, NoteId } from "features/note/domain/types/Note";

/**
 * メモの永続化を担う出力ポート（リポジトリインターフェース）。
 * 実装は infrastructure 層に置き、ドメイン／アプリケーション層は
 * このインターフェースにのみ依存する。
 */
export interface NoteRepository {
  findAll(): Promise<Note[]>;
  create(note: NewNote): Promise<Note>;
  update(id: NoteId, note: NoteEdit): Promise<void>;
  updateImportant(id: NoteId, isImportant: boolean): Promise<void>;
  updatePinned(id: NoteId, isPinned: boolean): Promise<void>;
  updateCompleted(id: NoteId, isCompleted: boolean): Promise<void>;
  /** 論理削除（削除フラグの更新） */
  markAsDeleted(id: NoteId): Promise<void>;
  /** 物理削除 */
  remove(id: NoteId): Promise<void>;
}
