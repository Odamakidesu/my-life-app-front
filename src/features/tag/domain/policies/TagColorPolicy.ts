import { Tag } from "features/tag/domain/types/Tag";

/** タグの色にまつわる判断ロジック */

/** 色が未登録のタグに使う既定色 */
export const DEFAULT_TAG_COLOR = "#6c757d";

/** タグ名から登録済みの色を引く（未登録なら既定色） */
export const colorOfTagName = (tags: Tag[], name: string): string =>
  tags.find((tag) => tag.name === name)?.color ?? DEFAULT_TAG_COLOR;

/**
 * 背景色に対して読みやすい文字色を返す。
 * 明るさを RGB の加重平均でざっくり計算して判定する。
 */
export const textColorForBackground = (bgColor: string): string => {
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "#000" : "#fff";
};
