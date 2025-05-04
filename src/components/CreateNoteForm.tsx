import React from "react";
import Select from "react-select";
import { Tag } from "../types/tags";
type CreateNoteFormProps = {
  newTitle: string;
  newNote: string;
  newTags: string;
  newDeadline: string;
  formSelectedTags: string[];
  setNewTitle: (value: string) => void;
  setNewNote: (value: string) => void;
  setNewTags: (value: string) => void;
  setNewDeadline: (value: string) => void;
  setFormSelectedTags: (value: string[]) => void;
  handleAddNote: () => void;
  tags: Tag[];
};

const CreateNoteForm: React.FC<CreateNoteFormProps> = ({
  newTitle,
  newNote,
  newTags,
  newDeadline,
  formSelectedTags,
  setNewTitle,
  setNewNote,
  setNewTags,
  setNewDeadline,
  setFormSelectedTags,
  handleAddNote,
  tags,
}) => {
  const handleTagChange = (selectedOptions: any) => {
    const options = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setFormSelectedTags(options);
    setNewTags(options.join(",")); // カンマ区切りも更新
  };
  const options = tags.map((tag) => ({ value: tag.name, label: tag.name }));

  return (
    <form
      className="mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleAddNote();
      }}
    >
      <div className="row g-2 align-items-end">
        <div className="col-md-4">
          <label className="form-label">タイトル</label>
          <input
            type="text"
            className="form-control"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="タイトルを入力"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">締切日時</label>
          <input
            type="datetime-local"
            className="form-control"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">タグ（複数選択可）</label>
          <Select
            isMulti
            classNamePrefix="select"
            options={options}
            value={options.filter((option) =>
              formSelectedTags.includes(option.value)
            )}
            onChange={handleTagChange}
          />
        </div>
        <div className="col-md-1 d-grid">
          <button className="btn btn-primary" type="submit">
            追加
          </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <label className="form-label">本文</label>
          <textarea
            className="form-control"
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="メモを入力"
          />
        </div>
      </div>
    </form>
  );
};

export default CreateNoteForm;
