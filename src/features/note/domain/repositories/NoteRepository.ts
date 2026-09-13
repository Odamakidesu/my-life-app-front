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
  /**
   * 論理削除（削除フラグの更新）。
   *
   * 物理削除のポートは持たない。サーバ側に対応するエンドポイントが無く、
   * 実装があっても呼べば 405 になるだけで、消し忘れると
   * 「呼べるように見えて必ず失敗する操作」が残り続ける。
   */
  markAsDeleted(id: NoteId): Promise<void>;
}
