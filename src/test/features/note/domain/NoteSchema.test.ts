import {
  CONTENT_MAX_LENGTH,
  NoteValidationError,
  TITLE_MAX_LENGTH,
  noteInputSchema,
  parseNoteInput,
} from "features/note/types/schema";

const validInput = {
  title: "会議の準備",
  content: "資料を作成する",
  tags: ["仕事"],
  deadline: "",
};

describe("noteInputSchema", () => {
  test("前後の空白を取り除いて正規化する", () => {
    const parsed = noteInputSchema.parse({
      ...validInput,
      title: "  会議の準備  ",
      content: "  資料を作成する  ",
    });

    expect(parsed.title).toBe("会議の準備");
    expect(parsed.content).toBe("資料を作成する");
  });

  test("空白だけのタイトルは弾く", () => {
    const result = noteInputSchema.safeParse({ ...validInput, title: "   " });

    expect(result.success).toBe(false);
  });

  test("上限を超える長さを弾く", () => {
    expect(
      noteInputSchema.safeParse({
        ...validInput,
        title: "あ".repeat(TITLE_MAX_LENGTH + 1),
      }).success
    ).toBe(false);

    expect(
      noteInputSchema.safeParse({
        ...validInput,
        content: "あ".repeat(CONTENT_MAX_LENGTH + 1),
      }).success
    ).toBe(false);
  });
});

describe("parseNoteInput", () => {
  test("検証に通れば正規化した値を返す", () => {
    expect(parseNoteInput(validInput)).toEqual(validInput);
  });

  test("検証に失敗したら NoteValidationError を送出する", () => {
    expect(() => parseNoteInput({ ...validInput, content: "" })).toThrow(
      NoteValidationError
    );
    expect(() => parseNoteInput({ ...validInput, content: "" })).toThrow(
      "本文を入力してください"
    );
  });
});
