import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  SESSION_EXPIRED_PARAM,
  onSessionExpired,
} from "shared/auth/sessionExpiry";

/**
 * セッション失効を受けてログイン画面へ退避させる。
 *
 * 通信層は「失効した」という出来事だけを通知し、遷移の判断はここが持つ。
 * Router の内側に置く必要があるため、App からこの位置で描画している。
 *
 * 画面には何も出さない。
 */
const SessionExpiryWatcher: React.FC = () => {
  const navigate = useNavigate();

  useEffect(
    () =>
      onSessionExpired(() => {
        // replace にして、戻るボタンで認証切れの画面に戻れないようにする
        navigate(`/?${SESSION_EXPIRED_PARAM}=1`, { replace: true });
      }),
    [navigate]
  );

  return null;
};

export default SessionExpiryWatcher;
