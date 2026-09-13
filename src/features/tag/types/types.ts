/** タグの型定義 */
export type Tag = {
  id: number;
  name: string;
  color: string;
};

export interface TagRepository {
  findAll(): Promise<Tag[]>;
}
