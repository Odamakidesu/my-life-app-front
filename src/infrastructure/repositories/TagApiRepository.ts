import { AxiosInstance } from "axios";
import { Tag } from "features/tag/domain/types/Tag";
import { TagRepository } from "features/tag/domain/repositories/TagRepository";
import { parseTagList } from "infrastructure/repositories/schemas/tagApiSchema";

const RESOURCE = "/tags";

/** REST API を用いた TagRepository の実装 */
export class TagApiRepository implements TagRepository {
  constructor(private readonly http: AxiosInstance) {}

  async findAll(): Promise<Tag[]> {
    const response = await this.http.get(RESOURCE);
    return parseTagList(response.data);
  }
}
