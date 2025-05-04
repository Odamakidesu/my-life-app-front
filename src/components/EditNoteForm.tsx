import React from "react";
import Select from "react-select";
import { Tag } from "../types/tags";

type EditNoteFormProps = {
  editingTitle: string;
  editingContent: string;
  editingTags: string;
  editingDeadline: string;
  editingFormSelectedTags: string[];
  setEditingTitle: (value: string) => void;
  setEditingContent: (value: string) => void;
  setEditingTags: (value: string) => void;
  setEditingFormSelectedTags: (value: string[]) => void;
  setEditingDeadline: (value: string) => void;
  handleSaveNote: () => void;
  cancelEdit: () => void;
  tags: Tag[];
};

const EditNoteForm: React.FC<EditNoteFormProps> = ({
  editingTitle,
  editingContent,
  editingTags,
  editingDeadline,
  editingFormSelectedTags,
  setEditingTitle,
  setEditingContent,
  setEditingTags,
  setEditingFormSelectedTags,
  setEditingDeadline,
  handleSaveNote,
  cancelEdit,
  tags,
}) => {
  const handleTagChange = (selectedOptions: any) => {
    const options = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setEditingFormSelectedTags(options);
    setEditingTags(options.join(",")); // カンマ区切りも更新
  };
  const options = tags.map((tag) => ({ value: tag.name, label: tag.name }));

  return (
    <form
      className="mb-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveNote();
      }}
    >
      <div className="row g-2 align-items-end">
        <div className="col-md-4">
          <label className="form-label">タイトル</label>
          <input
            type="text"
            className="form-control"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            placeholder="タイトルを入力"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">締切日時</label>
          <input
            type="datetime-local"
            className="form-control"
            value={editingDeadline}
            onChange={(e) => setEditingDeadline(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">タグ（複数選択可）</label>
          <Select
            isMulti
            classNamePrefix="select"
            options={options}
            value={options.filter((option) =>
              editingFormSelectedTags.includes(option.value)
            )}
            onChange={handleTagChange}
          />
        </div>
        <div className="col-md-1 d-grid">
          <button className="btn btn-success" type="submit">
            保存
          </button>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <label className="form-label">本文</label>
          <textarea
            className="form-control"
            rows={3}
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            placeholder="本文を入力"
          />
        </div>
      </div>

      {/* タグのカンマ区切り表示は非表示で保持 */}
      <input
        type="text"
        value={editingTags}
        onChange={(e) => setEditingTags(e.target.value)}
        disabled
        hidden
      />

      <div className="d-flex justify-content-end mt-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={cancelEdit}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
};

export default EditNoteForm;
