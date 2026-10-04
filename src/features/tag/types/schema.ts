import { z } from "zod";

/**
 * タグの入力に対する検証ルール。サーバ（TagRequest）と同じ制約。
 *
 * 名前にカンマを許さないのは、メモがタグを「カンマ区切りの名前」で持つため。
 * 許すとそのタグを付けたメモが別々の2つのタグとして読まれる。
 */
export const tagDraftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "タグ名を入力してください")
    .max(50, "タグ名は50文字以内で入力してください")
    .regex(/^[^,]*$/, "タグ名にカンマは使えません"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "色は #RRGGBB の形式で指定してください"),
});

export type TagInput = z.infer<typeof tagDraftSchema>;

/** 入力値がタグの検証ルールを満たさなかったことを表す例外 */
export class TagValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TagValidationError";
    Object.setPrototypeOf(this, TagValidationError.prototype);
  }
}

/** 入力値を検証して正規化する（失敗時は最初の理由を持つ例外） */
export const parseTagDraft = (input: TagInput): TagInput => {
  const result = tagDraftSchema.safeParse(input);
  if (!result.success) {
    throw new TagValidationError(
      result.error.issues[0]?.message ?? "タグの入力内容に誤りがあります"
    );
  }
  return result.data;
};
