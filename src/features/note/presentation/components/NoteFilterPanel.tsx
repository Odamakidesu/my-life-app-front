import React from "react";
import { Form } from "react-bootstrap";
import { NoteFilterOptions } from "features/note/domain/policies/NoteFilter";

type NoteFilterPanelProps = {
  filters: NoteFilterOptions;
  onChange: (filters: Partial<NoteFilterOptions>) => void;
};

/** 重要度・完了状態による絞り込みパネル */
const NoteFilterPanel: React.FC<NoteFilterPanelProps> = ({
  filters,
  onChange,
}) => (
  <div className="mb-4 d-flex flex-wrap gap-4">
    <div className="card shadow-sm border-primary" style={{ minWidth: "260px" }}>
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <span>重要度フィルター</span>
      </div>
      <div className="card-body d-flex justify-content-around">
        <Form.Check
          type="switch"
          id="filter-pinned"
          label="📌 ピン留め"
          checked={filters.onlyPinned}
          onChange={(e) => onChange({ onlyPinned: e.target.checked })}
        />
        <Form.Check
          type="switch"
          id="filter-important"
          label="⭐ スター付き"
          checked={filters.onlyImportant}
          onChange={(e) => onChange({ onlyImportant: e.target.checked })}
        />
      </div>
    </div>

    <div className="card shadow-sm border-success" style={{ minWidth: "260px" }}>
      <div className="card-header bg-success text-white d-flex align-items-center">
        <span>完了状態フィルター</span>
      </div>
      <div className="card-body d-flex justify-content-around">
        <Form.Check
          type="switch"
          id="filter-completed"
          label="✅ 完了済み"
          checked={filters.includeCompleted}
          onChange={(e) => onChange({ includeCompleted: e.target.checked })}
        />
        <Form.Check
          type="switch"
          id="filter-uncompleted"
          label="⏳ 未完了"
          checked={filters.includeUncompleted}
          onChange={(e) => onChange({ includeUncompleted: e.target.checked })}
        />
      </div>
    </div>
  </div>
);

export default NoteFilterPanel;
