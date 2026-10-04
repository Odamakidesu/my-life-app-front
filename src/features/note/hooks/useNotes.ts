import { useCallback, useEffect, useRef, useState } from "react";
import { Notifier } from "shared/types/Notifier";
import {
  ExportFormat,
  Note,
  NoteId,
  NoteQuery,
  NoteSummary,
} from "features/note/types/types";
import { NoteInput, NoteValidationError } from "features/note/types/schema";
import { useServices } from "infrastructure/di/ServicesContext";
import {
  ApiFailure,
  apiFailureMessage,
  toApiFailure,
} from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";
import { saveBlob } from "shared/download";

const DELETE_ANIMATION_MS = 300;

/** 最初に表示する件数と、「もっと見る」で増やす件数 */
export const NOTES_PAGE_SIZE = 50;

/** 1 回の要求で取得する上限（サーバの MAX_PAGE_SIZE と同じ） */
const MAX_REQUEST_SIZE = 500;

const emptySummary: NoteSummary = { total: 0, overdue: 0, dueSoon: 0 };

/**
 * 利用者に通知すべき失敗かどうか。
 *
 * 401 は通信層がトークンを破棄してログイン画面へ退避させる。
 * ここでも通知すると、画面が切り替わる途中で赤いトーストが一瞬出るだけになり、
 * しかも「メモの取得に失敗しました」という実態と食い違う文言が残る。
 */
const shouldNotifyFailure = (failure: ApiFailure): boolean =>
  failure.kind !== "unauthorized";

/**
 * メモのユースケースを React コンポーネントから使うためのアダプタ。
 * 画面の見た目は持たず、「一覧の状態」と「ユースケースの起動」だけを扱う。
 *
 * 絞り込み・並べ替えはサーバが行う。ここは条件（query）に合うメモの先頭から
 * limit 件を保持し、「もっと見る」で limit を増やす。更新のあとは同じ範囲を取り直す。
 */
export const useNotes = (notify: Notifier, query: NoteQuery) => {
  const { noteService } = useServices();
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<NoteSummary>(emptySummary);
  /**
   * 表示する件数。条件ごとに持ち、条件が変わったら先頭の 1 ページ分に戻す。
   * 条件の変更と件数の巻き戻しを別々の state にすると、古い件数で 1 回余分に取得してしまう。
   * query は呼び出し側で useMemo して参照を安定させること。
   */
  const [expanded, setExpanded] = useState({ query, limit: NOTES_PAGE_SIZE });
  const limit = expanded.query === query ? expanded.limit : NOTES_PAGE_SIZE;
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * 一覧へ反映してよい結果の世代。
   * 再取得は複数同時に走り得るうえ完了順は保証されないため、
   * 世代が古い結果は破棄する。これが無いと、先に投げた取得（古い検索条件など）が
   * 後から着地して新しい状態を巻き戻し、表示と実データが恒久的にずれる。
   */
  const generation = useRef(0);
  /** 実行中の再取得の数（読み込み表示の管理用） */
  const pendingReloads = useRef(0);

  /** 先頭から limit 件を、サーバの上限を超えないよう分けて取得する */
  const fetchWindow = useCallback(
    async (targetQuery: NoteQuery, count: number) => {
      const size = Math.min(count, MAX_REQUEST_SIZE);
      const collected: Note[] = [];
      let matched = 0;
      for (let page = 0; collected.length < count; page += 1) {
        const result = await noteService.search(targetQuery, page, size);
        collected.push(...result.notes);
        matched = result.total;
        if (result.notes.length < size) break;
      }
      return { notes: collected.slice(0, count), total: matched };
    },
    [noteService]
  );

  const reload = useCallback(async () => {
    const current = ++generation.current;
    pendingReloads.current += 1;
    setIsLoading(true);

    try {
      const [page, loadedSummary] = await Promise.all([
        fetchWindow(query, limit),
        noteService.summarize(),
      ]);
      if (current === generation.current) {
        setNotes(page.notes);
        setTotal(page.total);
        setSummary(loadedSummary);
      }
    } catch (error) {
      console.error("メモ取得失敗", describeError(error));
      const failure = toApiFailure(error);
      if (current === generation.current && shouldNotifyFailure(failure)) {
        notify(apiFailureMessage(failure, "メモの取得に失敗しました"), "danger");
      }
    } finally {
      pendingReloads.current -= 1;
      if (pendingReloads.current === 0) setIsLoading(false);
    }
  }, [fetchWindow, query, limit, noteService, notify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** 表示件数を増やす（増えた分を含めて取り直す） */
  const loadMore = useCallback(() => {
    setExpanded({ query, limit: limit + NOTES_PAGE_SIZE });
  }, [query, limit]);

  /**
   * 失敗を利用者向けの通知に落とす。
   *
   * サーバは失敗時に利用者向けのメッセージを返すので、呼び出し側の定型文より
   * それを優先する。「メモの削除に失敗しました」より
   * 「対象のメモが見つかりませんでした」の方が、次に何をすべきかが分かる。
   */
  const handleFailure = useCallback(
    (error: unknown, fallbackMessage: string): false => {
      if (error instanceof NoteValidationError) {
        notify(error.message, "danger");
        return false;
      }

      console.error(fallbackMessage, describeError(error));
      const failure = toApiFailure(error);

      if (failure.kind === "notFound") {
        // 他の端末で削除された等で手元の一覧が古い。取り直せば表示が揃う。
        notify("対象のメモが見つかりませんでした。一覧を更新します。", "warning");
        void reload();
        return false;
      }

      if (shouldNotifyFailure(failure)) {
        notify(apiFailureMessage(failure, fallbackMessage), "danger");
      }
      return false;
    },
    [notify, reload]
  );

  const addNote = useCallback(
    async (input: NoteInput): Promise<boolean> => {
      try {
        await noteService.create(input);
        notify("メモを追加しました", "success");
        await reload();
        return true;
      } catch (error) {
        return handleFailure(error, "メモの追加に失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const saveNote = useCallback(
    async (id: NoteId, input: NoteInput): Promise<boolean> => {
      try {
        await noteService.update(id, input);
        notify("メモを更新しました", "success");
        await reload();
        return true;
      } catch (error) {
        return handleFailure(error, "メモの更新に失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const deleteNote = useCallback(
    async (id: NoteId): Promise<boolean> => {
      setIsDeleting(true);
      try {
        await noteService.softDelete(id);
        notify("メモをゴミ箱に移動しました", "success");
        await new Promise((resolve) =>
          setTimeout(resolve, DELETE_ANIMATION_MS)
        );
        await reload();
        return true;
      } catch (error) {
        return handleFailure(error, "メモの削除に失敗しました");
      } finally {
        setIsDeleting(false);
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const toggleImportant = useCallback(
    async (note: Note): Promise<void> => {
      try {
        await noteService.toggleImportant(note);
        notify(
          note.isImportant ? "スターを解除しました" : "スターしました",
          "success"
        );
        await reload();
      } catch (error) {
        handleFailure(error, "スター切り替えに失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const togglePinned = useCallback(
    async (note: Note): Promise<void> => {
      try {
        await noteService.togglePinned(note);
        notify(
          note.isPinned ? "ピン留めを解除しました" : "ピン留めしました",
          "success"
        );
        await reload();
      } catch (error) {
        handleFailure(error, "ピン留め切り替えに失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const toggleCompleted = useCallback(
    async (note: Note): Promise<void> => {
      try {
        const nextId = await noteService.toggleCompleted(note);
        notify(
          note.isCompleted
            ? "未完了に戻しました"
            : nextId !== null
              ? "完了済みにしました。次回分のメモを作成しました"
              : "完了済みにしました",
          "success"
        );
        await reload();
      } catch (error) {
        handleFailure(error, "完了状態の変更に失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  const exportNotes = useCallback(
    async (format: ExportFormat): Promise<void> => {
      try {
        const file = await noteService.exportAll(format);
        saveBlob(file.content, file.fileName);
      } catch (error) {
        handleFailure(error, "エクスポートに失敗しました");
      }
    },
    [noteService, handleFailure]
  );

  return {
    notes,
    total,
    summary,
    hasMore: notes.length < total,
    isLoading,
    isDeleting,
    reload,
    loadMore,
    addNote,
    saveNote,
    deleteNote,
    toggleImportant,
    togglePinned,
    toggleCompleted,
    exportNotes,
  };
};
