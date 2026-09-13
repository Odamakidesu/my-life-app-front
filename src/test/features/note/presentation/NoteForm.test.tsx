import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  TITLE_MAX_LENGTH,
  emptyNoteInput,
} from "features/note/domain/schemas/NoteSchema";
import NoteForm from "features/note/presentation/components/NoteForm";

test("未入力のまま送信するとドメインの検証メッセージが出て、送信されない", async () => {
  const onSubmit = jest.fn();

  render(
    <NoteForm
      mode="create"
      defaultValues={emptyNoteInput}
      tags={[]}
      onSubmit={onSubmit}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "追加" }));

  expect(await screen.findByText("タイトルを入力してください")).toBeInTheDocument();
  expect(screen.getByText("本文を入力してください")).toBeInTheDocument();
  expect(onSubmit).not.toHaveBeenCalled();
});

test("入力が揃っていれば正規化された値で送信される", async () => {
  const onSubmit = jest.fn().mockResolvedValue(true);

  render(
    <NoteForm
      mode="create"
      defaultValues={emptyNoteInput}
      tags={[]}
      onSubmit={onSubmit}
    />
  );

  fireEvent.change(screen.getByLabelText("タイトル"), {
    target: { value: "  会議の準備  " },
  });
  fireEvent.change(screen.getByLabelText("本文"), {
    target: { value: "資料を作成する" },
  });
  fireEvent.click(screen.getByRole("button", { name: "追加" }));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      title: "会議の準備", // 前後の空白はスキーマが取り除く
      content: "資料を作成する",
      tags: [],
      deadline: "",
    })
  );
});

test("入力に応じて文字数カウンターが更新される", async () => {
  render(
    <NoteForm
      mode="create"
      defaultValues={emptyNoteInput}
      tags={[]}
      onSubmit={jest.fn()}
    />
  );

  expect(screen.getByText(`0 / ${TITLE_MAX_LENGTH}`)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("タイトル"), {
    target: { value: "あいう" },
  });

  expect(
    await screen.findByText(`3 / ${TITLE_MAX_LENGTH}`)
  ).toBeInTheDocument();
});

test("編集モードでは変更するまで保存できない", async () => {
  render(
    <NoteForm
      mode="edit"
      defaultValues={{
        title: "会議の準備",
        content: "資料を作成する",
        tags: [],
        deadline: "",
      }}
      tags={[]}
      onSubmit={jest.fn()}
      onCancel={jest.fn()}
    />
  );

  const saveButton = screen.getByRole("button", { name: "保存" });
  expect(saveButton).toBeDisabled();

  fireEvent.change(screen.getByLabelText("タイトル"), {
    target: { value: "会議の準備（更新）" },
  });

  await waitFor(() => expect(saveButton).toBeEnabled());
});
