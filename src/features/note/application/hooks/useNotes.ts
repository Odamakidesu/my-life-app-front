import { useCallback, useEffect, useRef, useState } from "react";
import { Notifier } from "shared/types/Notifier";
import { Note, NoteId } from "features/note/domain/types/Note";
import { sortByPriority } from "features/note/domain/policies/NoteSortPolicy";
import { NoteInput, NoteValidationError } from "features/note/domain/schemas/NoteSchema";
import { useServices } from "infrastructure/di/ServicesContext";
import {
  ApiFailure,
  apiFailureMessage,
  toApiFailure,
} from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

const DELETE_ANIMATION_MS = 300;

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
 */
export const useNotes = (notify: Notifier) => {
  const { noteService } = useServices();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * 一覧へ反映してよい結果の世代。
   * 再取得は複数同時に走り得るうえ完了順は保証されないため、
   * 世代が古い結果は破棄する。これが無いと、先に投げた取得が後から
   * 着地して新しい状態を巻き戻し、表示と実データが恒久的にずれる。
   */
  const generation = useRef(0);
  /** 実行中の再取得の数（読み込み表示の管理用） */
  const pendingReloads = useRef(0);

  /** 実行中の再取得の結果を無効化する（ローカル更新を上書きさせない） */
  const invalidateInFlightReloads = useCallback(() => {
    generation.current += 1;
  }, []);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    pendingReloads.current += 1;
    setIsLoading(true);

    try {
      const loaded = await noteService.list();
      if (current === generation.current) setNotes(loaded);
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
  }, [noteService, notify]);

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

  useEffect(() => {
    reload();
  }, [reload]);

  const addNote = useCallback(
    async (input: NoteInput): Promise<boolean> => {
      try {
        const created = await noteService.create(input);
        invalidateInFlightReloads();
        setNotes((prev) => sortByPriority([created, ...prev]));
        notify("メモを追加しました", "success");
        return true;
      } catch (error) {
        return handleFailure(error, "メモの追加に失敗しました");
      }
    },
    [noteService, notify, handleFailure, invalidateInFlightReloads]
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
        notify("メモを削除しました", "success");
        await new Promise((resolve) =>
          setTimeout(resolve, DELETE_ANIMATION_MS)
        );
        invalidateInFlightReloads();
        setNotes((prev) => prev.filter((note) => note.id !== id));
        return true;
      } catch (error) {
        return handleFailure(error, "メモの削除に失敗しました");
      } finally {
        setIsDeleting(false);
      }
    },
    [noteService, notify, handleFailure, invalidateInFlightReloads]
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
        await noteService.toggleCompleted(note);
        notify(
          note.isCompleted ? "未完了に戻しました" : "完了済みにしました",
          "success"
        );
        await reload();
      } catch (error) {
        handleFailure(error, "完了状態の変更に失敗しました");
      }
    },
    [noteService, notify, reload, handleFailure]
  );

  return {
    notes,
    isLoading,
    isDeleting,
    reload,
    addNote,
    saveNote,
    deleteNote,
    toggleImportant,
    togglePinned,
    toggleCompleted,
  };
};
