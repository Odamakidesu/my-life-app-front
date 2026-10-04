/** タグの型定義 */
export type TagId = number;

export type Tag = {
  id: TagId;
  name: string;
  color: string;
  /** 自分が作ったタグなら true。共通タグ（初期データ）は編集できない */
  editable: boolean;
};

/** タグの作成・更新に必要な入力値 */
export type TagDraft = {
  name: string;
  color: string;
};

export interface TagRepository {
  findAll(): Promise<Tag[]>;
  create(draft: TagDraft): Promise<Tag>;
  update(id: TagId, draft: TagDraft): Promise<Tag>;
  remove(id: TagId): Promise<void>;
}
