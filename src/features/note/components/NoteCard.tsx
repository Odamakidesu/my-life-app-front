import React from "react";
import { Button, Card } from "react-bootstrap";
import { format } from "date-fns-tz";
import { parseISO } from "date-fns";
import {
  deadlineStatusOf,
  tagNamesOf,
} from "features/note/logic";
import { Note } from "features/note/types/types";
import {
  colorOfTagName,
  textColorForBackground,
} from "features/tag/logic";
import { Tag } from "features/tag/types/types";
import HighlightedText from "shared/components/HighlightedText";

type NoteCardProps = {
  note: Note;
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
      className={`mb-3 h-100 shadow-sm d-flex flex-column ${
        note.isCompleted ? "opacity-75" : ""
      } ${deadlineBorderClassOf(note)}`}
    >
      <Card.Body className="card-body d-flex flex-column flex-grow-1 justify-content-between">
        <Card.Title
          className={`fs-5 px-3 py-2 rounded mb-2 bg-body-secondary ${
            note.isCompleted
              ? "text-decoration-line-through text-body-secondary"
              : ""
          }`}
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
            <span className="text-body-secondary fst-italic">
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
            variant={note.isImportant ? "warning" : "outline-warning"}
            size="sm"
            className="me-2"
            onClick={() => onToggleImportant(note)}
          >
            ⭐
          </Button>
          <Button
            variant={note.isPinned ? "danger" : "outline-danger"}
            size="sm"
            className="me-2"
            onClick={() => onTogglePinned(note)}
          >
            📌
          </Button>
          <Button
            variant={note.isCompleted ? "success" : "outline-success"}
            size="sm"
            className="me-2"
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
