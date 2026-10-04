import { Tag, TagDraft, TagId } from "features/tag/types/types";
import { TagRepository } from "features/tag/types/types";
import { parseTagDraft } from "features/tag/types/schema";

/** タグに関するユースケース */
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  async list(): Promise<Tag[]> {
    return this.repository.findAll();
  }

  /** タグを作成する（入力は必ず検証してから永続化に渡す） */
  async create(draft: TagDraft): Promise<Tag> {
    return this.repository.create(parseTagDraft(draft));
  }

  /** 名前・色を変更する。改名するとサーバが自分のメモに付いた旧名も置き換える */
  async update(id: TagId, draft: TagDraft): Promise<Tag> {
    return this.repository.update(id, parseTagDraft(draft));
  }

  /** タグを削除する。メモに付いたタグ名は残る（色が既定色になる） */
  async remove(id: TagId): Promise<void> {
    await this.repository.remove(id);
  }
}
