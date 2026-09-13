import React, { createContext, useContext, useMemo } from "react";
import { AuthService } from "features/auth/application/services/AuthService";
import { NoteService } from "features/note/application/services/NoteService";
import { TagService } from "features/tag/application/services/TagService";
import { authService, noteService, tagService } from "infrastructure/di/container";

/**
 * アプリケーションサービスの供給口。
 *
 * フックが container のシングルトンを直接 import すると、
 * 読み込んだ時点で実 HTTP 実装に固定され、別実装への差し替えも
 * テストでの偽実装の注入もできなくなる。ここを経由させることで
 * 「どの実装を使うか」を知るのは合成ルートと Provider だけになる。
 */
export type Services = {
  authService: AuthService;
  noteService: NoteService;
  tagService: TagService;
};

/** 既定値は合成ルートが組み立てた本番実装 */
const defaultServices: Services = { authService, noteService, tagService };

const ServicesContext = createContext<Services>(defaultServices);

type ServicesProviderProps = {
  /** 差し替えたいサービスだけを指定する（未指定は既定の実装） */
  services?: Partial<Services>;
  children: React.ReactNode;
};

export const ServicesProvider: React.FC<ServicesProviderProps> = ({
  services,
  children,
}) => {
  const value = useMemo<Services>(
    () => ({ ...defaultServices, ...services }),
    [services]
  );

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

/** サービス群を取得する。Provider が無い場合は既定の実装が返る */
export const useServices = (): Services => useContext(ServicesContext);
