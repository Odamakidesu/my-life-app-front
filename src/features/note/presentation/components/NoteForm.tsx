import React, { useMemo } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import { tagNamesOf } from "features/note/domain/policies/NotePolicy";
import { Note } from "features/note/domain/types/Note";
import {
  CONTENT_MAX_LENGTH,
  NoteInput,
  TITLE_MAX_LENGTH,
  emptyNoteInput,
  noteInputSchema,
} from "features/note/domain/schemas/NoteSchema";
import { Tag } from "features/tag/domain/types/Tag";
import CharCounter from "features/note/presentation/components/CharCounter";

type TagOption = {
  value: string;
  label: string;
};

type NoteFormProps = {
  mode: "create" | "edit";
  defaultValues: NoteInput;
  tags: Tag[];
  /** 送信結果。true のときだけ入力欄を初期化する */
  onSubmit: (values: NoteInput) => Promise<boolean>;
  onCancel?: () => void;
};

/** 既存のメモを編集フォームの初期値へ変換する */
export const toNoteInput = (note: Note): NoteInput => ({
  title: note.title,
  content: note.content,
  tags: tagNamesOf(note),
  deadline: note.deadline ?? "",
});

/**
 * メモの新規作成・編集フォーム。
 * 検証はドメインの noteInputSchema を resolver 経由でそのまま使うため、
 * 画面側にルールを書き写す必要がない。
 */
const NoteForm: React.FC<NoteFormProps> = ({
  mode,
  defaultValues,
  tags,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NoteInput>({
    resolver: zodResolver(noteInputSchema),
    defaultValues,
  });

  // react-select へ毎レンダー新しい配列を渡さないよう参照を固定する
  const options = useMemo<TagOption[]>(
    () => tags.map((tag) => ({ value: tag.name, label: tag.name })),
    [tags]
  );

  const submit: SubmitHandler<NoteInput> = async (values) => {
    const succeeded = await onSubmit(values);
    if (succeeded && mode === "create") {
      reset(emptyNoteInput);
    }
  };

  return (
    <form className="mb-4" onSubmit={handleSubmit(submit)} noValidate>
      <div className="row g-2 align-items-start">
        <div className="col-md-4">
          <label className="form-label" htmlFor="note-title">
            タイトル
          </label>
          <input
            id="note-title"
            type="text"
            className={`form-control ${errors.title ? "is-invalid" : ""}`}
            placeholder="タイトルを入力"
            {...register("title")}
          />
          {errors.title && (
            <div className="invalid-feedback">{errors.title.message}</div>
          )}
          <CharCounter control={control} name="title" max={TITLE_MAX_LENGTH} />
        </div>

        <div className="col-md-3">
          <label className="form-label" htmlFor="note-deadline">
            締切日時
          </label>
          <input
            id="note-deadline"
            type="datetime-local"
            className={`form-control ${errors.deadline ? "is-invalid" : ""}`}
            {...register("deadline")}
          />
          {errors.deadline && (
            <div className="invalid-feedback">{errors.deadline.message}</div>
          )}
        </div>

        <div className="col-md-4">
          <label className="form-label" htmlFor="note-tags">
            タグ（複数選択可）
          </label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Select
                inputId="note-tags"
                isMulti
                classNamePrefix="select"
                options={options}
                value={options.filter((option) =>
                  field.value.includes(option.value)
                )}
                onChange={(selected) =>
                  field.onChange(selected.map((option) => option.value))
                }
                onBlur={field.onBlur}
              />
            )}
          />
          {errors.tags && (
            <div className="text-danger small mt-1">{errors.tags.message}</div>
          )}
        </div>

        <div className="col-md-1 d-grid">
          {/* ラベル分の高さを合わせる */}
          <label className="form-label invisible d-none d-md-block">
            &nbsp;
          </label>
          <button
            className={`btn ${mode === "create" ? "btn-primary" : "btn-success"}`}
            type="submit"
            disabled={isSubmitting || (mode === "edit" && !isDirty)}
          >
            {mode === "create" ? "追加" : "保存"}
          </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <label className="form-label" htmlFor="note-content">
            本文
          </label>
          <textarea
            id="note-content"
            className={`form-control ${errors.content ? "is-invalid" : ""}`}
            rows={3}
            placeholder="メモを入力"
            {...register("content")}
          />
          {errors.content && (
            <div className="invalid-feedback">{errors.content.message}</div>
          )}
          <CharCounter
            control={control}
            name="content"
            max={CONTENT_MAX_LENGTH}
          />
        </div>
      </div>

      {mode === "edit" && onCancel && (
        <div className="d-flex justify-content-end mt-3">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            キャンセル
          </button>
        </div>
      )}
    </form>
  );
};

export default NoteForm;
