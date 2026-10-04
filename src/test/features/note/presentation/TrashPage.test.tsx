import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TrashPage from "features/note/TrashPage";
import { NoteService } from "features/note/services/NoteService";
import { Note } from "features/note/types/types";
import { ServicesProvider } from "infrastructure/di/ServicesContext";

const note = (id: number, title: string): Note => ({
  id,
  title,
  content: "本文",
  createdAt: "2026-01-01T00:00:00",
});

const renderWith = (noteService: Partial<NoteService>) =>
  render(
    <ServicesProvider services={{ noteService: noteService as NoteService }}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TrashPage theme="light" />
      </MemoryRouter>
    </ServicesProvider>
  );

describe("TrashPage", () => {
  afterEach(() => vi.restoreAllMocks());

  test("空なら空である旨を表示する", async () => {
    renderWith({ listDeleted: vi.fn().mockResolvedValue([]) });

    expect(await screen.findByText("ゴミ箱は空です。")).toBeInTheDocument();
  });

  test("復元したメモは一覧から消える", async () => {
    const restore = vi.fn().mockResolvedValue(undefined);
    renderWith({
      listDeleted: vi.fn().mockResolvedValue([note(1, "戻すメモ"), note(2, "残すメモ")]),
      restore,
    });
    const user = userEvent.setup();

    await screen.findByText("戻すメモ");
    await user.click(screen.getAllByRole("button", { name: "復元" })[0]);

    expect(restore).toHaveBeenCalledWith(1);
    expect(screen.queryByText("戻すメモ")).not.toBeInTheDocument();
    expect(screen.getByText("残すメモ")).toBeInTheDocument();
  });

  test("完全削除は確認を取り消すと実行しない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const deletePermanently = vi.fn();
    renderWith({
      listDeleted: vi.fn().mockResolvedValue([note(1, "消すメモ")]),
      deletePermanently,
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "完全に削除" }));

    expect(deletePermanently).not.toHaveBeenCalled();
    expect(screen.getByText("消すメモ")).toBeInTheDocument();
  });

  test("完全削除を確認すると実行して一覧から消す", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const deletePermanently = vi.fn().mockResolvedValue(undefined);
    renderWith({
      listDeleted: vi.fn().mockResolvedValue([note(1, "消すメモ")]),
      deletePermanently,
    });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "完全に削除" }));

    expect(deletePermanently).toHaveBeenCalledWith(1);
    expect(screen.queryByText("消すメモ")).not.toBeInTheDocument();
  });
});
