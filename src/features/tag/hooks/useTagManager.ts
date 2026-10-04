import { useCallback, useEffect, useState } from "react";
import { Tag, TagDraft, TagId } from "features/tag/types/types";
import { TagValidationError } from "features/tag/types/schema";
import { useServices } from "infrastructure/di/ServicesContext";
import { Notifier } from "shared/types/Notifier";
import { apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

/** タグ管理画面のユースケースを扱うアダプタ */
export const useTagManager = (notify: Notifier) => {
  const { tagService } = useServices();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setTags(await tagService.list());
    } catch (error) {
      console.error("タグ取得失敗", describeError(error));
      const failure = toApiFailure(error);
      if (failure.kind !== "unauthorized") {
        notify(apiFailureMessage(failure, "タグの取得に失敗しました"), "danger");
      }
    } finally {
      setIsLoading(false);
    }
  }, [tagService, notify]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /**
   * 失敗を通知に落とす。409（名前の重複）や 400 はサーバの文言が具体的なのでそれを見せる。
   * 404 は他の端末で削除された等で手元が古いので取り直す。
   */
  const handleFailure = useCallback(
    (error: unknown, fallbackMessage: string): false => {
      if (error instanceof TagValidationError) {
        notify(error.message, "danger");
        return false;
      }
      console.error(fallbackMessage, describeError(error));
      const failure = toApiFailure(error);
      if (failure.kind === "notFound") {
        notify("対象のタグが見つかりませんでした。一覧を更新します。", "warning");
        void reload();
      } else if (failure.kind !== "unauthorized") {
        notify(apiFailureMessage(failure, fallbackMessage), "danger");
      }
      return false;
    },
    [notify, reload]
  );

  const createTag = useCallback(
    async (draft: TagDraft): Promise<boolean> => {
      try {
        const created = await tagService.create(draft);
        setTags((prev) => [...prev, created]);
        notify("タグを追加しました", "success");
        return true;
      } catch (error) {
        return handleFailure(error, "タグの追加に失敗しました");
      }
    },
    [tagService, notify, handleFailure]
  );

  const updateTag = useCallback(
    async (id: TagId, draft: TagDraft): Promise<boolean> => {
      try {
        const updated = await tagService.update(id, draft);
        setTags((prev) => prev.map((tag) => (tag.id === id ? updated : tag)));
        notify("タグを更新しました", "success");
        return true;
      } catch (error) {
        return handleFailure(error, "タグの更新に失敗しました");
      }
    },
    [tagService, notify, handleFailure]
  );

  const removeTag = useCallback(
    async (id: TagId): Promise<boolean> => {
      try {
        await tagService.remove(id);
        setTags((prev) => prev.filter((tag) => tag.id !== id));
        notify("タグを削除しました", "success");
        return true;
      } catch (error) {
        return handleFailure(error, "タグの削除に失敗しました");
      }
    },
    [tagService, notify, handleFailure]
  );

  return { tags, isLoading, createTag, updateTag, removeTag };
};
