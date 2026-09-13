import { AxiosInstance } from "axios";
import { NoteApiRepository } from "infrastructure/repositories/NoteApiRepository";

/**
 * 一覧取得のページング。
 *
 * サーバの一覧 API は件数を指定しないと既定値（100 件）で打ち切られる。
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

const httpOf = (get: jest.Mock) => ({ get } as unknown as AxiosInstance);

describe("NoteApiRepository#findAll", () => {
  afterEach(() => jest.restoreAllMocks());

  test("1ページに収まる場合は1回だけ要求する", async () => {
    const get = jest.fn().mockResolvedValue({ data: pageOf(3) });

    const notes = await new NoteApiRepository(httpOf(get)).findAll();

    expect(notes).toHaveLength(3);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/notes", {
      params: { page: 0, size: PAGE_SIZE },
    });
  });

  test("満杯のページが返る間は次のページを取りに行き、全件を返す", async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({ data: pageOf(PAGE_SIZE, 1) })
      .mockResolvedValueOnce({ data: pageOf(PAGE_SIZE, PAGE_SIZE + 1) })
      .mockResolvedValueOnce({ data: pageOf(7, PAGE_SIZE * 2 + 1) });

    const notes = await new NoteApiRepository(httpOf(get)).findAll();

    expect(notes).toHaveLength(PAGE_SIZE * 2 + 7);
    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenNthCalledWith(2, "/notes", {
      params: { page: 1, size: PAGE_SIZE },
    });
    expect(get).toHaveBeenNthCalledWith(3, "/notes", {
      params: { page: 2, size: PAGE_SIZE },
    });
    // 取得順（=サーバの並び順）が保たれていること
    expect(notes[0].id).toBe(1);
    expect(notes[notes.length - 1].id).toBe(PAGE_SIZE * 2 + 7);
  });

  test("ちょうど1ページ分だった場合は空ページを1回だけ確認して終わる", async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce({ data: pageOf(PAGE_SIZE) })
      .mockResolvedValueOnce({ data: [] });

    const notes = await new NoteApiRepository(httpOf(get)).findAll();

    expect(notes).toHaveLength(PAGE_SIZE);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test("常に満杯が返り続けても上限で打ち切り、警告を残す", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const get = jest.fn().mockResolvedValue({ data: pageOf(PAGE_SIZE) });

    const notes = await new NoteApiRepository(httpOf(get)).findAll();

    // 無限に要求し続けてブラウザを固めないこと
    expect(get).toHaveBeenCalledTimes(50);
    expect(notes).toHaveLength(PAGE_SIZE * 50);
    expect(warn).toHaveBeenCalled();
  });

  test("取得に失敗した場合は例外を伝播させる", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const get = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(new NoteApiRepository(httpOf(get)).findAll()).rejects.toThrow(
      "boom"
    );
  });
});

describe("NoteApiRepository#create", () => {
  test("作成日時や id を送らない（サーバが決めるため）", async () => {
    const post = jest.fn().mockResolvedValue({ data: noteJson(1) });
    const http = { post } as unknown as AxiosInstance;

    await new NoteApiRepository(http).create({
      title: "タイトル",
      content: "本文",
      tags: "仕事",
      deadline: null,
    });

    expect(post).toHaveBeenCalledWith("/notes", {
      title: "タイトル",
      content: "本文",
      tags: "仕事",
      deadline: null,
    });
    const payload = post.mock.calls[0][1];
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("created_at");
  });
});
