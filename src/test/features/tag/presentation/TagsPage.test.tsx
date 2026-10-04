import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import TagsPage from "features/tag";
import { TagService } from "features/tag/services/TagService";
import { Tag } from "features/tag/types/types";
import { ServicesProvider } from "infrastructure/di/ServicesContext";

const shared: Tag = { id: 1, name: "仕事", color: "#007bff", editable: false };
const own: Tag = { id: 2, name: "趣味", color: "#112233", editable: true };

const renderWith = (tagService: Partial<TagService>) =>
  render(
    <ServicesProvider services={{ tagService: tagService as TagService }}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TagsPage theme="light" />
      </MemoryRouter>
    </ServicesProvider>
  );

describe("TagsPage", () => {
  test("共通タグには編集ボタンを出さず、自分のタグには出す", async () => {
    renderWith({ list: vi.fn().mockResolvedValue([shared, own]) });

    const sharedRow = (await screen.findByText("仕事")).closest(".list-group-item")!;
    const ownRow = screen.getByText("趣味").closest(".list-group-item")!;

    expect(within(sharedRow as HTMLElement).getByText("共通タグ（編集不可）")).toBeInTheDocument();
    expect(within(sharedRow as HTMLElement).queryByRole("button", { name: "編集" })).toBeNull();
    expect(within(ownRow as HTMLElement).getByRole("button", { name: "編集" })).toBeInTheDocument();
  });

  test("追加したタグが一覧に加わり、入力欄が空に戻る", async () => {
    const created: Tag = { id: 3, name: "読書", color: "#6c757d", editable: true };
    const create = vi.fn().mockResolvedValue(created);
    renderWith({ list: vi.fn().mockResolvedValue([shared]), create });
    const user = userEvent.setup();

    await screen.findByText("仕事");
    const [nameInput] = screen.getAllByLabelText("タグ名");
    await user.type(nameInput, "読書");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(create).toHaveBeenCalledWith({ name: "読書", color: "#6c757d" });
    expect(await screen.findByText("読書", { selector: ".badge" })).toBeInTheDocument();
    expect(nameInput).toHaveValue("");
  });

  test("改名すると一覧の表示が変わる", async () => {
    const update = vi.fn().mockResolvedValue({ ...own, name: "趣味2" });
    renderWith({ list: vi.fn().mockResolvedValue([own]), update });
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "編集" }));
    const inputs = screen.getAllByLabelText("タグ名");
    const editInput = inputs[inputs.length - 1];
    await user.clear(editInput);
    await user.type(editInput, "趣味2");
    await user.click(screen.getByRole("button", { name: "保存" }));

    expect(update).toHaveBeenCalledWith(2, { name: "趣味2", color: "#112233" });
    expect(await screen.findByText("趣味2", { selector: ".badge" })).toBeInTheDocument();
  });
});
