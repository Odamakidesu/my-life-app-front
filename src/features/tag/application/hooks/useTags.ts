import { useEffect, useState } from "react";
import { Tag } from "features/tag/domain/types/Tag";
import { useServices } from "infrastructure/di/ServicesContext";
import { Notifier } from "shared/types/Notifier";
import { apiFailureMessage, toApiFailure } from "shared/api/apiFailure";
import { describeError } from "shared/logging/describeError";

/**
 * タグ一覧を取得して保持するアダプタ。
 * 取得に失敗すると一覧は空のままで「タグが 0 件」と見分けが付かないため、
 * 通知先を受け取って利用者に失敗を伝える。
 */
export const useTags = (notify?: Notifier) => {
  const { tagService } = useServices();
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      try {
        const loaded = await tagService.list();
        if (isCurrent) setTags(loaded);
      } catch (error) {
        console.error("タグ取得失敗", describeError(error));
        const failure = toApiFailure(error);
        // 401 は通信層がログイン画面へ退避させる。ここで通知すると
        // 遷移の途中で実態と食い違う警告が一瞬出るだけになる。
        if (isCurrent && failure.kind !== "unauthorized") {
          notify?.(apiFailureMessage(failure, "タグの取得に失敗しました"), "warning");
        }
      }
    };

    load();
    return () => {
      isCurrent = false;
    };
  }, [tagService, notify]);

  return { tags };
};
