import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NotesPage from "features/note";
import { NoteService } from "features/note/services/NoteService";
import { Note, NoteQuery } from "features/note/types/types";
import { NOTES_PAGE_SIZE } from "features/note/hooks/useNotes";
import { AuthService } from "features/auth/services/AuthService";
import { TagService } from "features/tag/services/TagService";
import { ServicesProvider } from "infrastructure/di/ServicesContext";

const note = (id: number): Note => ({
  id,
  title: `メモ${id}`,
  content: "本文",
  createdAt: "2026-01-01T00:00:00",
});

const notesFrom = (start: number, count: number) =>
  Array.from({ length: count }, (_, index) => note(start + index));

const renderWith = (noteService: Partial<NoteService>, role: "USER" | "ADMIN" = "USER") =>
  render(
    <ServicesProvider
      services={{
        noteService: {
          summarize: vi.fn().mockResolvedValue({ total: 120, overdue: 2, dueSoon: 0 }),
          ...noteService,
        } as NoteService,
        tagService: { list: vi.fn().mockResolvedValue([]) } as unknown as TagService,
        authService: {
          currentUser: vi.fn().mockResolvedValue({ id: 1, username: "me", role }),
        } as unknown as AuthService,
      }}
    >
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <NotesPage theme="light" />
      </MemoryRouter>
    </ServicesProvider>
  );

describe("NotesPage", () => {
  test("最初は1ページ分を表示し、「もっと見る」で続きを取り直して表示する", async () => {
    const search = vi.fn((_query: NoteQuery, _page: number, size: number) =>
      Promise.resolve({ notes: notesFrom(1, Math.min(size, 120)), total: 120 })
    );
    renderWith({ search });
    const user = userEvent.setup();

    await screen.findByText("📝 メモ1");
    expect(screen.queryByText(`📝 メモ${NOTES_PAGE_SIZE + 1}`)).toBeNull();
    expect(search).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: "PRIORITY" }),
      0,
      NOTES_PAGE_SIZE
    );

    await user.click(screen.getByRole("button", { name: /もっと見る/ }));

    expect(await screen.findByText(`📝 メモ${NOTES_PAGE_SIZE + 1}`)).toBeInTheDocument();
    expect(search).toHaveBeenLastCalledWith(expect.anything(), 0, NOTES_PAGE_SIZE * 2);
  });

  test("期限切れの件数を押すと、期限切れだけに絞った条件で取り直す", async () => {
    const search = vi.fn().mockResolvedValue({ notes: [note(1)], total: 1 });
    renderWith({ search });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /期限切れ 2件/ }));

    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ due: "OVERDUE" }),
        0,
        NOTES_PAGE_SIZE
      )
    );
  });

  test("並べ替えを変えるとサーバに並べ替えを渡す", async () => {
    const search = vi.fn().mockResolvedValue({ notes: [note(1)], total: 1 });
    renderWith({ search });
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("並べ替え"), "DEADLINE");

    await waitFor(() =>
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: "DEADLINE" }),
        0,
        NOTES_PAGE_SIZE
      )
    );
  });

  test("管理画面への入口は管理者にだけ出す", async () => {
    const search = vi.fn().mockResolvedValue({ notes: [], total: 0 });
    renderWith({ search }, "ADMIN");

    expect(await screen.findByRole("link", { name: "管理画面" })).toBeInTheDocument();
  });

  test("一般ユーザーには管理画面への入口を出さない", async () => {
    const search = vi.fn().mockResolvedValue({ notes: [note(1)], total: 1 });
    renderWith({ search });

    await screen.findByText("📝 メモ1");
    expect(screen.queryByRole("link", { name: "管理画面" })).toBeNull();
  });
});
