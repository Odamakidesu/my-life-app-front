import { AxiosInstance } from "axios";
import {
  ExportFormat,
  ExportedFile,
  NewNote,
  Note,
  NoteEdit,
  NoteId,
  NotePage,
  NoteQuery,
  NoteRepository,
  NoteSummary,
} from "features/note/types/types";
import {
  parseNextNoteId,
  parseNote,
  parseNoteList,
  parseNoteSummary,
} from "infrastructure/repositories/schemas/noteApiSchema";
import { describeError } from "shared/logging/describeError";

const RESOURCE = "/notes";

/**
 * ゴミ箱を取得するときの 1 回の件数。サーバ側の上限（MAX_PAGE_SIZE）と揃えてある。
 * これを超える値を送っても、サーバが上限側へ丸めるだけで例外にはならない。
 */
const TRASH_PAGE_SIZE = 500;

/**
 * ゴミ箱の取得を打ち切るページ数の上限。
 * サーバの応答が想定と異なり常に満杯のページを返した場合に、
 * 無限に要求し続けてブラウザを固めるのを防ぐための安全弁。
 */
const MAX_PAGES = 50;

/** 検索条件を一覧 API のクエリ文字列に変換する（未指定の項目は送らない） */
export const toSearchParams = (
  query: NoteQuery,
  page: number,
  size: number
): Record<string, string | number | boolean> => {
  const params: Record<string, string | number | boolean> = {
    page,
    size,
    sort: query.sort,
  };
  const keyword = query.keyword.trim();
  if (keyword) params.q = keyword;
  if (query.tags.length > 0) params.tags = query.tags.join(",");
  if (query.onlyPinned) params.pinned = true;
  if (query.onlyImportant) params.important = true;
  if (query.completed !== undefined) params.completed = query.completed;
  if (query.due) params.due = query.due;
  return params;
};

/** 応答の X-Total-Count。無ければ受け取った件数を総数とみなす */
const totalCountOf = (headers: unknown, fallback: number): number => {
  const raw = (headers as Record<string, unknown> | undefined)?.["x-total-count"];
  const total = Number(raw);
  return raw !== undefined && Number.isFinite(total) ? total : fallback;
};

/** REST API を用いた NoteRepository の実装 */
export class NoteApiRepository implements NoteRepository {
  constructor(private readonly http: AxiosInstance) {}

  async search(query: NoteQuery, page: number, size: number): Promise<NotePage> {
    try {
      const response = await this.http.get(RESOURCE, {
        params: toSearchParams(query, page, size),
      });
      const notes = parseNoteList(response.data);
      return { notes, total: totalCountOf(response.headers, notes.length) };
    } catch (error) {
      console.error("メモ一覧取得エラー", describeError(error));
      throw error;
    }
  }

  async summarize(): Promise<NoteSummary> {
    try {
      const response = await this.http.get(`${RESOURCE}/summary`);
      return parseNoteSummary(response.data);
    } catch (error) {
      console.error("メモの集計の取得エラー", describeError(error));
      throw error;
    }
  }

  async exportAll(format: ExportFormat): Promise<ExportedFile> {
    try {
      const response = await this.http.get(`${RESOURCE}/export`, {
        params: { format },
        responseType: "blob",
      });
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      return {
        fileName: `mylifeapp-notes-${date}.${format}`,
        content: response.data as Blob,
      };
    } catch (error) {
      console.error("エクスポートエラー", describeError(error));
      throw error;
    }
  }

  /** ゴミ箱のメモを全件取得する（件数は多くならない想定なので最後のページまで辿る） */
  async findDeleted(): Promise<Note[]> {
    try {
      const notes: Note[] = [];
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const response = await this.http.get(`${RESOURCE}/deleted`, {
          params: { page, size: TRASH_PAGE_SIZE },
        });
        const batch = parseNoteList(response.data);
        notes.push(...batch);
        // 満杯でなければ最後のページ
        if (batch.length < TRASH_PAGE_SIZE) return notes;
      }
      console.warn(
        `ゴミ箱の取得が上限ページ数(${MAX_PAGES})に達しました。以降は取得していません`
      );
      return notes;
    } catch (error) {
      console.error("ゴミ箱の取得エラー", describeError(error));
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
        recurrence: note.recurrence,
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
        recurrence: note.recurrence,
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

  async updateCompleted(id: NoteId, isCompleted: boolean): Promise<NoteId | null> {
    try {
      const response = await this.http.put(`${RESOURCE}/${id}/completed`, {
        completed: isCompleted,
      });
      return parseNextNoteId(response.data);
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

  async restore(id: NoteId): Promise<void> {
    try {
      await this.http.put(`${RESOURCE}/${id}/deleted`, { delete_flg: false });
    } catch (error) {
      console.error("復元エラー", describeError(error));
      throw error;
    }
  }

  async deletePermanently(id: NoteId): Promise<void> {
    try {
      await this.http.delete(`${RESOURCE}/${id}`);
    } catch (error) {
      console.error("完全削除エラー", describeError(error));
      throw error;
    }
  }
}
