import { parseTagDraft, TagValidationError } from "features/tag/types/schema";
import { parseTagList } from "infrastructure/repositories/schemas/tagApiSchema";

describe("parseTagDraft", () => {
  test("前後の空白を落として通す", () => {
    expect(parseTagDraft({ name: "  趣味 ", color: "#AbCdEf" })).toEqual({
      name: "趣味",
      color: "#AbCdEf",
    });
  });

  test.each([
    [{ name: " ", color: "#000000" }, "タグ名を入力してください"],
    [{ name: "a".repeat(51), color: "#000000" }, "タグ名は50文字以内で入力してください"],
    [{ name: "a,b", color: "#000000" }, "タグ名にカンマは使えません"],
    [{ name: "趣味", color: "red" }, "色は #RRGGBB の形式で指定してください"],
  ])("%o は弾く", (input, message) => {
    expect(() => parseTagDraft(input)).toThrow(TagValidationError);
    expect(() => parseTagDraft(input)).toThrow(message);
  });
});

describe("parseTagList", () => {
  test("editable を返さない古いサーバでは編集不可として扱う", () => {
    expect(parseTagList([{ id: 1, name: "仕事", color: "#007bff" }])).toEqual([
      { id: 1, name: "仕事", color: "#007bff", editable: false },
    ]);
  });
});
