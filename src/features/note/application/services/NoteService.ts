import { format } from "date-fns-tz";
import { toTagString } from "features/note/domain/policies/NotePolicy";
import { Note, NoteId } from "features/note/domain/types/Note";
import { NoteRepository } from "features/note/domain/repositories/NoteRepository";
import { NoteInput, parseNoteInput } from "features/note/domain/schemas/NoteSchema";
import { sortByPriority } from "features/note/domain/policies/NoteSortPolicy";

/**
 * メモに関するユースケースを組み立てるアプリケーションサービス。
 * 受け取った入力は必ずドメインのスキーマで検証してから永続化に渡すため、
 * 画面側の検証が漏れても不正な値が保存されることはない。
 */
export class NoteService {
  constructor(private readonly repository: NoteRepository) {}

  /** 表示順に整えたメモ一覧を取得する */
  async list(): Promise<Note[]> {
    const notes = await this.repository.findAll();
    return sortByPriority(notes);
  }

  /** メモを新規作成する */
  async create(input: NoteInput): Promise<Note> {
    const validated = parseNoteInput(input);

    return this.repository.create({
      title: validated.title,
      content: validated.content,
      tags: toTagString(validated.tags),
      createdAt: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
      deadline: validated.deadline,
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
    });
  }

  /** メモを論理削除する */
  async softDelete(id: NoteId): Promise<void> {
    await this.repository.markAsDeleted(id);
  }

  /** メモを物理削除する */
  async deletePermanently(id: NoteId): Promise<void> {
    await this.repository.remove(id);
  }

  /** スター（重要フラグ）を切り替える */
  async toggleImportant(note: Note): Promise<void> {
    await this.repository.updateImportant(note.id, !note.isImportant);
  }

  /** ピン留めを切り替える */
  async togglePinned(note: Note): Promise<void> {
    await this.repository.updatePinned(note.id, !note.isPinned);
  }

  /** 完了状態を切り替える */
  async toggleCompleted(note: Note): Promise<void> {
    await this.repository.updateCompleted(note.id, !note.isCompleted);
  }
}
