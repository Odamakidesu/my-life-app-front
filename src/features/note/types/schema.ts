import { z } from "zod";

/**
 * メモの入力値に対するドメインの検証ルール。
 * 画面（React Hook Form の resolver）とアプリケーション層の双方が
 * この 1 つのスキーマを参照するため、ルールの二重管理が起きない。
 */

export const TITLE_MAX_LENGTH = 50;
/**
 * 本文の上限。サーバの NoteLimits.CONTENT_MAX_LENGTH（note.content は TEXT）と揃えてある。
 * どちらかだけを変えると、画面では検証に通ったのに保存で 400 になる（またはその逆）。
 */
export const CONTENT_MAX_LENGTH = 10000;

/** 繰り返しの選択肢。空文字は「繰り返さない」 */
export const RECURRENCE_OPTIONS = [
  { value: "", label: "繰り返さない" },
  { value: "DAILY", label: "毎日" },
  { value: "WEEKLY", label: "毎週" },
  { value: "MONTHLY", label: "毎月" },
] as const;

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
  /** 繰り返しの間隔。空文字は繰り返さない */
  recurrence: z.enum(["", "DAILY", "WEEKLY", "MONTHLY"]),
}).refine((input) => input.recurrence === "" || input.deadline !== "", {
  message: "繰り返すには締切を入力してください",
  path: ["recurrence"],
});

/** 検証済みのメモ入力値 */
export type NoteInput = z.infer<typeof noteInputSchema>;

/** 空のフォーム初期値 */
export const emptyNoteInput: NoteInput = {
  title: "",
  content: "",
  tags: [],
  deadline: "",
  recurrence: "",
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
