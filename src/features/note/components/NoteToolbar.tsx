import React from "react";
import { Button, Form } from "react-bootstrap";
import { DueFilter, NoteSort, NoteSummary } from "features/note/types/types";

type NoteToolbarProps = {
  sort: NoteSort;
  onSortChange: (sort: NoteSort) => void;
  summary: NoteSummary;
  due?: DueFilter;
  onDueChange: (due?: DueFilter) => void;
  /** 条件に合うメモの数 */
  matchedCount: number;
};

const SORT_OPTIONS: { value: NoteSort; label: string }[] = [
  { value: "PRIORITY", label: "優先度順（ピン留め・スター）" },
  { value: "DEADLINE", label: "締切が近い順" },
  { value: "CREATED", label: "作成日の新しい順" },
];

/**
 * 一覧の上部。並べ替えと、期限切れ・24時間以内のメモの件数（押すとそれだけに絞る）。
 */
const NoteToolbar: React.FC<NoteToolbarProps> = ({
  sort,
  onSortChange,
  summary,
  due,
  onDueChange,
  matchedCount,
}) => {
  const toggleDue = (target: DueFilter) => onDueChange(due === target ? undefined : target);

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      <Form.Select
        aria-label="並べ替え"
        size="sm"
        style={{ maxWidth: "240px" }}
        value={sort}
        onChange={(e) => onSortChange(e.target.value as NoteSort)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>

      {summary.overdue > 0 && (
        <Button
          size="sm"
          variant={due === "OVERDUE" ? "danger" : "outline-danger"}
          aria-pressed={due === "OVERDUE"}
          onClick={() => toggleDue("OVERDUE")}
        >
          ⚠️ 期限切れ {summary.overdue}件
        </Button>
      )}
      {summary.dueSoon > 0 && (
        <Button
          size="sm"
          variant={due === "SOON" ? "warning" : "outline-warning"}
          aria-pressed={due === "SOON"}
          onClick={() => toggleDue("SOON")}
        >
          ⏰ 24時間以内 {summary.dueSoon}件
        </Button>
      )}
      {due && summary.overdue === 0 && summary.dueSoon === 0 && (
        <Button size="sm" variant="outline-secondary" onClick={() => onDueChange(undefined)}>
          締切の絞り込みを解除
        </Button>
      )}

      <span className="ms-auto small text-body-secondary">{matchedCount}件</span>
    </div>
  );
};

export default NoteToolbar;
