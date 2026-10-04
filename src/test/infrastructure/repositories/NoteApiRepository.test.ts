import type { Mock } from "vitest";
import { AxiosInstance } from "axios";
import { NoteApiRepository } from "infrastructure/repositories/NoteApiRepository";
import { NoteQuery } from "features/note/types/types";

/**
 * 一覧の検索条件の受け渡しと、ゴミ箱のページング。
 *
 * ゴミ箱の一覧 API は件数を指定しないと既定値（100 件）で打ち切られる。
 * 1 回だけ要求する実装だと、メモがその数を超えた時点で静かに欠落する。
 * 失敗としては現れないため、これはテストでしか守れない。
 */

const PAGE_SIZE = 500;

const noteJson = (id: number) => ({
  id,
  title: `メモ${id}`,
  content: "本文",
  created_at: "2026-01-01T00:00:00",
  tags: null,
  isImportant: false,
  isPinned: false,
  isCompleted: false,
  deadline: null,
});

const pageOf = (count: number, startId = 1) =>
  Array.from({ length: count }, (_, index) => noteJson(startId + index));

const httpOf = (get: Mock) => ({ get } as unknown as AxiosInstance);

const baseQuery: NoteQuery = {
  keyword: "",
  tags: [],
  onlyPinned: false,
  onlyImportant: false,
  sort: "PRIORITY",
};

describe("NoteApiRepository#search", () => {
  afterEach(() => vi.restoreAllMocks());

  test("条件の無い項目は送らず、総数は X-Total-Count から読む", async () => {
    const get = vi.fn().mockResolvedValue({
      data: pageOf(3),
      headers: { "x-total-count": "120" },
    });

    const result = await new NoteApiRepository(httpOf(get)).search(baseQuery, 0, 50);

    expect(get).toHaveBeenCalledWith("/notes", {
      params: { page: 0, size: 50, sort: "PRIORITY" },
    });
    expect(result.notes).toHaveLength(3);
    expect(result.total).toBe(120);
  });

  test("検索語・タグ・各フラグ・締切の条件をサーバの引数名で送る", async () => {
    const get = vi.fn().mockResolvedValue({ data: [], headers: {} });

    await new NoteApiRepository(httpOf(get)).search(
      {
        keyword: "  会議 ",
        tags: ["仕事", "勉強"],
        onlyPinned: true,
        onlyImportant: true,
        completed: false,
        due: "OVERDUE",
        sort: "DEADLINE",
      },
      2,
      50
    );

    expect(get).toHaveBeenCalledWith("/notes", {
      params: {
        page: 2,
        size: 50,
        sort: "DEADLINE",
        q: "会議",
        tags: "仕事,勉強",
        pinned: true,
        important: true,
        completed: false,
        due: "OVERDUE",
      },
    });
  });

  test("X-Total-Count が無ければ受け取った件数を総数とする", async () => {
    const get = vi.fn().mockResolvedValue({ data: pageOf(2), headers: {} });

    const result = await new NoteApiRepository(httpOf(get)).search(baseQuery, 0, 50);

    expect(result.total).toBe(2);
  });

  test("取得に失敗した場合は例外を伝播させる", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const get = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(
      new NoteApiRepository(httpOf(get)).search(baseQuery, 0, 50)
    ).rejects.toThrow("boom");
  });
});

describe("NoteApiRepository#updateCompleted", () => {
  test("繰り返しで作られた次回分の ID を返し、本文の無い応答（古いサーバ）は null にする", async () => {
    const put = vi
      .fn()
      .mockResolvedValueOnce({ data: { nextNoteId: 42 } })
      .mockResolvedValueOnce({ data: "" });
    const repository = new NoteApiRepository({ put } as unknown as AxiosInstance);

    await expect(repository.updateCompleted(1, true)).resolves.toBe(42);
    await expect(repository.updateCompleted(1, true)).resolves.toBeNull();
  });
});

describe("NoteApiRepository#create", () => {
  test("作成日時や id を送らない（サーバが決めるため）", async () => {
    const post = vi.fn().mockResolvedValue({ data: noteJson(1) });
    const http = { post } as unknown as AxiosInstance;

    await new NoteApiRepository(http).create({
      title: "タイトル",
      content: "本文",
      tags: "仕事",
      deadline: null,
      recurrence: "WEEKLY",
    });

    expect(post).toHaveBeenCalledWith("/notes", {
      title: "タイトル",
      content: "本文",
      tags: "仕事",
      deadline: null,
      recurrence: "WEEKLY",
    });
    const payload = post.mock.calls[0][1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
  });
});

describe("NoteApiRepository のゴミ箱操作", () => {
  test("ゴミ箱の一覧も最後のページまで辿る", async () => {
    const get = vi
      .fn()
      .mockResolvedValueOnce({ data: pageOf(PAGE_SIZE, 1) })
      .mockResolvedValueOnce({ data: pageOf(2, PAGE_SIZE + 1) });

    const notes = await new NoteApiRepository(httpOf(get)).findDeleted();

    expect(notes).toHaveLength(PAGE_SIZE + 2);
    expect(get).toHaveBeenNthCalledWith(1, "/notes/deleted", {
      params: { page: 0, size: PAGE_SIZE },
    });
    expect(get).toHaveBeenNthCalledWith(2, "/notes/deleted", {
      params: { page: 1, size: PAGE_SIZE },
    });
  });

  test("復元は delete_flg=false を送る", async () => {
    const put = vi.fn().mockResolvedValue({});
    const http = { put } as unknown as AxiosInstance;

    await new NoteApiRepository(http).restore(7);

    expect(put).toHaveBeenCalledWith("/notes/7/deleted", { delete_flg: false });
  });

  test("完全削除は DELETE を送る", async () => {
    const del = vi.fn().mockResolvedValue({});
    const http = { delete: del } as unknown as AxiosInstance;

    await new NoteApiRepository(http).deletePermanently(7);

    expect(del).toHaveBeenCalledWith("/notes/7");
  });
});
