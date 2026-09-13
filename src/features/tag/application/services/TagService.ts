import { Tag } from "features/tag/domain/types/Tag";
import { TagRepository } from "features/tag/domain/repositories/TagRepository";

/** タグに関するユースケース */
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  async list(): Promise<Tag[]> {
    return this.repository.findAll();
  }
}
