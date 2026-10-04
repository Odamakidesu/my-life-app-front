import { useCallback, useEffect, useState } from "react";
import { Note, NoteId } from "features/note/types/types";
import { useServices } from "infrastructure/di/ServicesContext";
import { Notifier } from "shared/types/Notifier";
import { apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

/**
 * ゴミ箱のユースケースを扱うアダプタ。
 * 復元・完全削除のあとは手元の一覧から取り除く（再取得はしない）。
 */
export const useTrash = (notify: Notifier) => {
  const { noteService } = useServices();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setNotes(await noteService.listDeleted());
    } catch (error) {
      console.error("ゴミ箱の取得失敗", describeError(error));
      const failure = toApiFailure(error);
      // 401 は通信層がログイン画面へ退避させるので通知しない
      if (failure.kind !== "unauthorized") {
        notify(apiFailureMessage(failure, "ゴミ箱の取得に失敗しました"), "danger");
      }
    } finally {
      setIsLoading(false);
    }
  }, [noteService, notify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * 404 は他の端末で既に復元・削除された等で手元の一覧が古いことを示す。
   * 取り直せば表示が揃う。
   */
  const run = useCallback(
    async (
      id: NoteId,
      action: (id: NoteId) => Promise<void>,
      successMessage: string,
      fallbackMessage: string
    ): Promise<boolean> => {
      try {
        await action(id);
        setNotes((prev) => prev.filter((note) => note.id !== id));
        notify(successMessage, "success");
        return true;
      } catch (error) {
        console.error(fallbackMessage, describeError(error));
        const failure = toApiFailure(error);
        if (failure.kind === "notFound") {
          notify("対象のメモが見つかりませんでした。一覧を更新します。", "warning");
          void reload();
        } else if (failure.kind !== "unauthorized") {
          notify(apiFailureMessage(failure, fallbackMessage), "danger");
        }
        return false;
      }
    },
    [notify, reload]
  );

  const restore = useCallback(
    (id: NoteId) =>
      run(
        id,
        (target) => noteService.restore(target),
        "メモを復元しました",
        "メモの復元に失敗しました"
      ),
    [run, noteService]
  );

  const deletePermanently = useCallback(
    (id: NoteId) =>
      run(
        id,
        (target) => noteService.deletePermanently(target),
        "メモを完全に削除しました",
        "メモの完全削除に失敗しました"
      ),
    [run, noteService]
  );

  return { notes, isLoading, restore, deletePermanently };
};
