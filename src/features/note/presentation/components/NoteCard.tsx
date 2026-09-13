import React from "react";
import { Button, Card } from "react-bootstrap";
import { format } from "date-fns-tz";
import { parseISO } from "date-fns";
import {
  deadlineStatusOf,
  tagNamesOf,
} from "features/note/domain/policies/NotePolicy";
import { Note } from "features/note/domain/types/Note";
import {
  colorOfTagName,
  textColorForBackground,
} from "features/tag/domain/policies/TagColorPolicy";
import { Tag } from "features/tag/domain/types/Tag";
import { ThemeName } from "shared/types/theme";
import HighlightedText from "shared/components/HighlightedText";

type NoteCardProps = {
  note: Note;
  theme: ThemeName;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
  onTagClick: (tag: string) => void;
  onToggleImportant: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onToggleCompleted: (note: Note) => void;
  tags: Tag[];
};

/** 締切状態に応じたカード枠線のクラス */
const deadlineBorderClassOf = (note: Note): string => {
  switch (deadlineStatusOf(note)) {
    case "overdue":
      return "border border-3 border-danger";
    case "dueSoon":
      return "border border-3 border-warning";
    default:
      return "";
  }
};

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  theme,
  onEdit,
  onDelete,
  searchQuery,
  onTagClick,
  onToggleImportant,
  onTogglePinned,
  onToggleCompleted,
  tags,
}) => {
  const noteTagNames = tagNamesOf(note);
  const isOverdue = deadlineStatusOf(note) === "overdue";

  return (
    <Card
      className={`mb-3 h-100 shadow-sm card-hover d-flex flex-column ${theme}-theme ${
        note.isPinned ? "pinned" : ""
      } ${note.isImportant ? "important" : ""} ${
        note.isCompleted ? "note-completed" : ""
      } ${deadlineBorderClassOf(note)}`}
    >
      <Card.Body className="card-body d-flex flex-column flex-grow-1 justify-content-between">
        <Card.Title
          className={`fs-5 px-3 py-2 rounded mb-2 ${
            note.isCompleted ? "text-decoration-line-through text-muted" : ""
          }`}
          style={{
            backgroundColor: theme === "dark" ? "#444" : "#f0f0f0",
            color: theme === "dark" ? "#fff" : "#212121",
            fontWeight: 500,
            letterSpacing: "0.5px",
          }}
        >
          📝 <HighlightedText text={note.title} query={searchQuery} />
        </Card.Title>
        <Card.Text>
          <HighlightedText text={note.content} query={searchQuery} />
        </Card.Text>

        {/* タグ表示部分 */}
        <div className="mb-2">
          {noteTagNames.length > 0 ? (
            noteTagNames.map((tagName, index) => {
              const bgColor = colorOfTagName(tags, tagName);

              return (
                <span
                  key={index}
                  className="badge me-1"
                  style={{
                    cursor: "pointer",
                    backgroundColor: bgColor,
                    color: textColorForBackground(bgColor),
                  }}
                  onClick={() => onTagClick(tagName)}
                >
                  {tagName}
                </span>
              );
            })
          ) : (
            <span
              className={theme === "dark" ? "text-secondary" : "text-muted"}
              style={{ fontStyle: "italic" }}
            >
              タグなし
            </span>
          )}
        </div>

        {/* 締切 */}
        <div className="mt-2" style={{ minHeight: "1.8rem" }}>
          {note.deadline ? (
            <span
              className={`badge ${
                isOverdue ? "bg-danger" : "bg-warning text-dark"
              }`}
            >
              {isOverdue ? "⚠️ " : ""}
              締切: {format(parseISO(note.deadline), "yyyy/MM/dd HH:mm")}
            </span>
          ) : (
            <span className="invisible">締切: 0000/00/00 00:00</span>
          )}
        </div>

        {/* 操作ボタン */}
        <div className="mt-2">
          <Button
            variant="primary"
            size="sm"
            className="me-2 rounded-pill"
            onClick={() => onEdit(note)}
          >
            編集
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="me-2 rounded-pill"
            onClick={() => onDelete(note.id)}
          >
            削除
          </Button>
          <Button
            variant={note.isImportant ? "" : "outline-warning"}
            size="sm"
            className={`me-2 ${note.isImportant ? "btn-important-active" : ""}`}
            onClick={() => onToggleImportant(note)}
          >
            ⭐
          </Button>
          <Button
            variant={note.isPinned ? "" : "outline-danger"}
            size="sm"
            className={`me-2 ${note.isPinned ? "btn-pinned-active" : ""}`}
            onClick={() => onTogglePinned(note)}
          >
            📌
          </Button>
          <Button
            variant={note.isCompleted ? "" : "outline-success"}
            size="sm"
            className={`me-2 ${note.isCompleted ? "btn-completed-active" : ""}`}
            onClick={() => onToggleCompleted(note)}
          >
            ✅
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

/**
 * 一覧のカードは件数分ぶら下がるので memo 化する。
 * 効かせるには親から渡すコールバックの参照が安定している必要がある。
 */
export default React.memo(NoteCard);
