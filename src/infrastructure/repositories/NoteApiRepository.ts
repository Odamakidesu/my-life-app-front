import { AxiosInstance } from "axios";
import { NewNote, Note, NoteEdit, NoteId } from "features/note/types/types";
import { NoteRepository } from "features/note/types/types";
import {
  parseNote,
  parseNoteList,
} from "infrastructure/repositories/schemas/noteApiSchema";
import { describeError } from "shared/logging/describeError";

const RESOURCE = "/notes";

/**
 * 1 回の要求で取得する件数。サーバ側の上限（MAX_PAGE_SIZE）と揃えてある。
 * これを超える値を送っても、サーバが上限側へ丸めるだけで例外にはならない。
 */
const PAGE_SIZE = 500;

/**
 * 取得を打ち切るページ数の上限。
 * サーバの応答が想定と異なり常に満杯のページを返した場合に、
 * 無限に要求し続けてブラウザを固めるのを防ぐための安全弁。
 */
const MAX_PAGES = 50;

/** REST API を用いた NoteRepository の実装 */
export class NoteApiRepository implements NoteRepository {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * 自分のメモを全件取得する。
   *
   * サーバの一覧 API はページングされており、件数を指定しないと既定値
   * （100 件）で打ち切られる。1 回だけ要求する実装だと、メモがその数を
   * 超えた時点で古いものが画面から静かに消える。エラーにはならないため
   * 気づきようがない。ここで最後のページまで辿り切る。
   */
  async findAll(): Promise<Note[]> {
    try {
      const notes: Note[] = [];

      for (let page = 0; page < MAX_PAGES; page += 1) {
        const response = await this.http.get(RESOURCE, {
          params: { page, size: PAGE_SIZE },
        });
        const batch = parseNoteList(response.data);
        notes.push(...batch);

        // 満杯でなければ最後のページ
        if (batch.length < PAGE_SIZE) return notes;
      }

      console.warn(
        `メモ一覧の取得が上限ページ数(${MAX_PAGES})に達しました。以降は取得していません`
      );
      return notes;
    } catch (error) {
      console.error("メモ一覧取得エラー", describeError(error));
      throw error;
    }
  }

  async create(note: NewNote): Promise<Note> {
    try {
      // 作成日時と所有者はサーバが決める。クライアントが送っても無視される。
      const response = await this.http.post(RESOURCE, {
        title: note.title,
        content: note.content,
        tags: note.tags,
        deadline: note.deadline,
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
}
