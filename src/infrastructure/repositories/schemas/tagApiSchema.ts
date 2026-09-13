import { z } from "zod";
import { Tag } from "features/tag/domain/types/Tag";

/**
 * API が返すタグの形。
 * 応答には created_at などの永続化都合の項目も含まれるが、
 * zod の object は未知のキーを落とすためドメインの形だけが残る。
 */
const tagApiSchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
});

const tagListApiSchema = z.array(tagApiSchema);

/** API 応答がタグの形を満たさなかったことを表す例外 */
export class TagResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TagResponseError";
    Object.setPrototypeOf(this, TagResponseError.prototype);
  }
}

export const parseTagList = (data: unknown): Tag[] => {
  const result = tagListApiSchema.safeParse(data);
  if (!result.success) {
    throw new TagResponseError("タグ一覧の応答が想定した形式ではありません");
  }
  return result.data;
};
