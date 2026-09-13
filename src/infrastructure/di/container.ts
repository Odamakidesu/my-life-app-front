import { AuthService } from "features/auth/application/services/AuthService";
import { NoteService } from "features/note/application/services/NoteService";
import { TagService } from "features/tag/application/services/TagService";
import { AuthRepository } from "features/auth/domain/repositories/AuthRepository";
import { TokenStorage } from "features/auth/domain/repositories/TokenStorage";
import { NoteRepository } from "features/note/domain/repositories/NoteRepository";
import { TagRepository } from "features/tag/domain/repositories/TagRepository";
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
