import React from "react";
import { Control, useWatch } from "react-hook-form";
import { NoteInput } from "features/note/domain/schemas/NoteSchema";

type CharCounterProps = {
  control: Control<NoteInput>;
  name: "title" | "content";
  max: number;
};

/**
 * 入力中の文字数を表示する。
 * useWatch で購読範囲をこのコンポーネントだけに閉じているため、
 * 打鍵のたびに再描画されるのはカウンターだけで、フォーム本体は再描画されない。
 */
const CharCounter: React.FC<CharCounterProps> = ({ control, name, max }) => {
  const value = useWatch({ control, name });
  const length = value?.length ?? 0;

  return (
    <small
      className={`d-block text-end ${
        length > max ? "text-danger" : "text-muted"
      }`}
    >
      {length} / {max}
    </small>
  );
};

export default CharCounter;
