import { AxiosInstance } from "axios";
import { Tag, TagDraft, TagId } from "features/tag/types/types";
import { TagRepository } from "features/tag/types/types";
import {
  parseTag,
  parseTagList,
} from "infrastructure/repositories/schemas/tagApiSchema";

const RESOURCE = "/tags";

/** REST API を用いた TagRepository の実装 */
export class TagApiRepository implements TagRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(): Promise<Tag[]> {
    const response = await this.http.get(RESOURCE);
    return parseTagList(response.data);
  }

  async create(draft: TagDraft): Promise<Tag> {
    const response = await this.http.post(RESOURCE, {
      name: draft.name,
      color: draft.color,
    });
    return parseTag(response.data);
  }

  async update(id: TagId, draft: TagDraft): Promise<Tag> {
    const response = await this.http.put(`${RESOURCE}/${id}`, {
      name: draft.name,
      color: draft.color,
    });
    return parseTag(response.data);
  }

  async remove(id: TagId): Promise<void> {
    await this.http.delete(`${RESOURCE}/${id}`);
  }
}
