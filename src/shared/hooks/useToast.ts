import { useCallback, useState } from "react";
import { NotificationVariant } from "shared/types/Notifier";

/** トースト表示という「画面の関心事」を閉じ込めたフック */
export const useToast = () => {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<NotificationVariant>("success");
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback(
    (nextMessage: string, nextVariant: NotificationVariant) => {
      setMessage(nextMessage);
      setVariant(nextVariant);
      setIsVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => setIsVisible(false), []);

  return { message, variant, isVisible, showToast, hideToast };
};
