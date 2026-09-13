import { AuthService } from "features/auth/services/AuthService";
import { NoteService } from "features/note/services/NoteService";
import { TagService } from "features/tag/services/TagService";
import { AuthRepository } from "features/auth/types/types";
import { TokenStorage } from "features/auth/types/types";
import { NoteRepository } from "features/note/types/types";
import { TagRepository } from "features/tag/types/types";
import { httpClient } from "infrastructure/http/httpClient";
import { AuthApiRepository } from "infrastructure/repositories/AuthApiRepository";
import { NoteApiRepository } from "infrastructure/repositories/NoteApiRepository";
import { TagApiRepository } from "infrastructure/repositories/TagApiRepository";
import { localStorageTokenStorage } from "infrastructure/storage/LocalStorageTokenStorage";

/**
 * 依存関係の組み立て（合成ルート）。
 * ここだけが「どの実装を使うか」を知っている。
 */
export const tokenStorage: TokenStorage = localStorageTokenStorage;

const noteRepository: NoteRepository = new NoteApiRepository(httpClient);
const tagRepository: TagRepository = new TagApiRepository(httpClient);
const authRepository: AuthRepository = new AuthApiRepository(httpClient);

export const noteService = new NoteService(noteRepository);
export const tagService = new TagService(tagRepository);
export const authService = new AuthService(authRepository, tokenStorage);
