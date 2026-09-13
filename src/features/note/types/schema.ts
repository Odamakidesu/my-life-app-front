import { z } from "zod";

/**
 * メモの入力値に対するドメインの検証ルール。
 * 画面（React Hook Form の resolver）とアプリケーション層の双方が
 * この 1 つのスキーマを参照するため、ルールの二重管理が起きない。
 */

export const TITLE_MAX_LENGTH = 50;
/**
 * 本文の上限。保存先の note.content が VARCHAR(255) のため、
 * ここを超える値を通すと画面では検証に通ったのに保存側で失われる。
 * DB の定義を変更する場合は必ず両方を合わせること。
 */
export const CONTENT_MAX_LENGTH = 255;

export const noteInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "タイトルを入力してください")
    .max(TITLE_MAX_LENGTH, `タイトルは${TITLE_MAX_LENGTH}文字以内にしてください`),
  content: z
    .string()
    .trim()
    .min(1, "本文を入力してください")
    .max(CONTENT_MAX_LENGTH, `本文は${CONTENT_MAX_LENGTH}文字以内にしてください`),
  tags: z.array(z.string().trim().min(1)),
  /** datetime-local の値。未設定なら空文字 */
  deadline: z.string(),
});

/** 検証済みのメモ入力値 */
export type NoteInput = z.infer<typeof noteInputSchema>;

/** 空のフォーム初期値 */
export const emptyNoteInput: NoteInput = {
  title: "",
  content: "",
  tags: [],
  deadline: "",
};

/** ドメインの入力規則に反したことを表す例外 */
export class NoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoteValidationError";
    // target: es5 で Error を継承した場合に instanceof を機能させるため
    Object.setPrototypeOf(this, NoteValidationError.prototype);
  }
}

/**
 * 入力値を検証して正規化する。
 * 画面を経由しない呼び出し（テストや将来の別 UI）でもルールを必ず通すための境界。
 * @throws NoteValidationError 検証に失敗した場合
 */
export const parseNoteInput = (input: unknown): NoteInput => {
  const result = noteInputSchema.safeParse(input);
  if (!result.success) {
    const message =
      result.error.issues[0]?.message ?? "入力内容が正しくありません";
    throw new NoteValidationError(message);
  }
  return result.data;
};
