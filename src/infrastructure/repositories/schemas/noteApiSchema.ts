import { z } from "zod";
import { Note } from "features/note/domain/types/Note";

/**
 * API が返すメモの形。
 *
 * 型注釈だけでは実行時に何も保証されないため、受信データはここを必ず通す。
 * 検証しないと、欠けたフィールドが描画やソートの途中で例外になり
 * （例: title が null で filter が TypeError、deadline が不正で
 * date-fns の format が RangeError）、原因から遠い場所で画面ごと落ちる。
 *
 * あわせて、API 側のスネークケースをドメインの命名へ寄せる。
 */
const noteApiSchema = z
  .object({
    id: z.number(),
    title: z.string(),
    content: z.string(),
    created_at: z.string(),
    tags: z.string().nullish(),
    isImportant: z.boolean().nullish(),
    isPinned: z.boolean().nullish(),
    isCompleted: z.boolean().nullish(),
    deadline: z.string().nullish(),
  })
  .transform(
    (dto): Note => ({
      id: dto.id,
      title: dto.title,
      content: dto.content,
      createdAt: dto.created_at,
      tags: dto.tags ?? undefined,
      isImportant: dto.isImportant ?? undefined,
      isPinned: dto.isPinned ?? undefined,
      isCompleted: dto.isCompleted ?? undefined,
      deadline: dto.deadline ?? undefined,
    })
  );

const noteListApiSchema = z.array(noteApiSchema);

/** API 応答がメモの形を満たさなかったことを表す例外 */
export class NoteResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoteResponseError";
    // target: es5 で Error を継承した場合に instanceof を機能させるため
    Object.setPrototypeOf(this, NoteResponseError.prototype);
  }
}

export const parseNote = (data: unknown): Note => {
  const result = noteApiSchema.safeParse(data);
  if (!result.success) {
    throw new NoteResponseError("メモの応答が想定した形式ではありません");
  }
  return result.data;
};

export const parseNoteList = (data: unknown): Note[] => {
  const result = noteListApiSchema.safeParse(data);
  if (!result.success) {
    throw new NoteResponseError("メモ一覧の応答が想定した形式ではありません");
  }
  return result.data;
};
