import { AxiosInstance } from "axios";
import { Tag } from "features/tag/types/types";
import { TagRepository } from "features/tag/types/types";
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
