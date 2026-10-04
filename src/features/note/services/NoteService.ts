import { toTagString } from "features/note/logic";
import {
  ExportFormat,
  ExportedFile,
  Note,
  NoteId,
  NotePage,
  NoteQuery,
  NoteRepository,
  NoteSummary,
  Recurrence,
} from "features/note/types/types";
import { NoteInput, parseNoteInput } from "features/note/types/schema";

const toRecurrence = (value: NoteInput["recurrence"]): Recurrence | null =>
  value === "" ? null : value;

/**
 * メモに関するユースケースを組み立てるアプリケーションサービス。
 * 受け取った入力は必ずドメインのスキーマで検証してから永続化に渡すため、
 * 画面側の検証が漏れても不正な値が保存されることはない。
 */
export class NoteService {
  constructor(private readonly repository: NoteRepository) {}

  /** 条件に合うメモを1ページ分取得する（絞り込みと並べ替えはサーバが行う） */
  async search(query: NoteQuery, page: number, size: number): Promise<NotePage> {
    return this.repository.search(query, page, size);
  }

  /** 全件・期限切れ・24時間以内の件数 */
  async summarize(): Promise<NoteSummary> {
    return this.repository.summarize();
  }

  /** 自分のメモ（ゴミ箱以外）をファイルとして書き出す */
  async exportAll(format: ExportFormat): Promise<ExportedFile> {
    return this.repository.exportAll(format);
  }

  /** メモを新規作成する */
  async create(input: NoteInput): Promise<Note> {
    const validated = parseNoteInput(input);

    return this.repository.create({
      title: validated.title,
      content: validated.content,
      tags: toTagString(validated.tags),
      deadline: validated.deadline,
      recurrence: toRecurrence(validated.recurrence),
    });
  }

  /** メモを更新する */
  async update(id: NoteId, input: NoteInput): Promise<void> {
    const validated = parseNoteInput(input);

    await this.repository.update(id, {
      title: validated.title,
      content: validated.content,
      tags: toTagString(validated.tags),
      deadline: validated.deadline,
      recurrence: toRecurrence(validated.recurrence),
    });
  }

  /** メモを論理削除する */
  async softDelete(id: NoteId): Promise<void> {
    await this.repository.markAsDeleted(id);
  }

  /** ゴミ箱のメモ（サーバがゴミ箱に入れた日時の新しい順で返す） */
  async listDeleted(): Promise<Note[]> {
    return this.repository.findDeleted();
  }

  /** ゴミ箱から一覧へ戻す */
  async restore(id: NoteId): Promise<void> {
    await this.repository.restore(id);
  }

  /** ゴミ箱のメモを完全に削除する（取り消せない） */
  async deletePermanently(id: NoteId): Promise<void> {
    await this.repository.deletePermanently(id);
  }

  /** スター（重要フラグ）を切り替える */
  async toggleImportant(note: Note): Promise<void> {
    await this.repository.updateImportant(note.id, !note.isImportant);
  }

  /** ピン留めを切り替える */
  async togglePinned(note: Note): Promise<void> {
    await this.repository.updatePinned(note.id, !note.isPinned);
  }

  /**
   * 完了状態を切り替える。
   * 繰り返しのメモを完了にした場合は、サーバが作った次回分の ID を返す。
   */
  async toggleCompleted(note: Note): Promise<NoteId | null> {
    return this.repository.updateCompleted(note.id, !note.isCompleted);
  }
}
