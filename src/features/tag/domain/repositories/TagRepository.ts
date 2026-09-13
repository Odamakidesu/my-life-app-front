import { Tag } from "features/tag/domain/types/Tag";

/** タグの取得を担う出力ポート */
export interface TagRepository {
  findAll(): Promise<Tag[]>;
}
