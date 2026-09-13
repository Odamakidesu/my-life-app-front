import { Tag } from "features/tag/types/types";
import { TagRepository } from "features/tag/types/types";

/** タグに関するユースケース */
export class TagService {
  constructor(private readonly repository: TagRepository) {}

  async list(): Promise<Tag[]> {
    return this.repository.findAll();
  }
}
