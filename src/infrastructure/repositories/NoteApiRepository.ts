import { AxiosInstance } from "axios";
import { NewNote, Note, NoteEdit, NoteId } from "features/note/domain/types/Note";
import { NoteRepository } from "features/note/domain/repositories/NoteRepository";
import {
  parseNote,
  parseNoteList,
} from "infrastructure/repositories/schemas/noteApiSchema";
import { describeError } from "shared/logging/describeError";

const RESOURCE = "/notes";

/** REST API を用いた NoteRepository の実装 */
export class NoteApiRepository implements NoteRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(): Promise<Note[]> {
    try {
      const response = await this.http.get(RESOURCE);
      return parseNoteList(response.data);
    } catch (error) {
      console.error("メモ一覧取得エラー", describeError(error));
      throw error;
    }
  }

  async create(note: NewNote): Promise<Note> {
    try {
      const response = await this.http.post(RESOURCE, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        deadline: note.deadline,
        created_at: note.createdAt,
      });
      return parseNote(response.data);
    } catch (error) {
      console.error("メモ作成エラー", describeError(error));
      throw error;
    }
  }

  async update(id: NoteId, note: NoteEdit): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}`, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        deadline: note.deadline,
      });
    } catch (error) {
      console.error("メモ更新エラー", describeError(error));
      throw error;
    }
  }

  async updateImportant(id: NoteId, isImportant: boolean): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}/important`, {
        important: isImportant,
      });
    } catch (error) {
      console.error("重要フラグ更新エラー", describeError(error));
      throw error;
    }
  }

  async updatePinned(id: NoteId, isPinned: boolean): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}/pinned`, { pinned: isPinned });
    } catch (error) {
      console.error("ピン留め更新エラー", describeError(error));
      throw error;
    }
  }

  async updateCompleted(id: NoteId, isCompleted: boolean): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}/completed`, {
        completed: isCompleted,
      });
    } catch (error) {
      console.error("完了フラグ更新エラー", describeError(error));
      throw error;
    }
  }

  async markAsDeleted(id: NoteId): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}/deleted`, { delete_flg: true });
    } catch (error) {
      console.error("削除更新エラー", describeError(error));
      throw error;
    }
  }

  async remove(id: NoteId): Promise<void> {
    try {
      await this.http.delete(`${RESOURCE}/${id}`);
    } catch (error) {
      console.error("メモ削除エラー", describeError(error));
      throw error;
    }
  }
}
