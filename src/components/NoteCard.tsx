import React from "react";
import { Button, Card } from "react-bootstrap";
import { Note } from "../types/note";
import HighlightedText from "../components/HighlightedText"; // ←追加
import { Tag } from "../types/tags";
import { format } from "date-fns-tz";
import { parseISO } from "date-fns";
type NoteCardProps = {
  note: Note;
  theme: "light" | "dark";
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  searchQuery: string;
  onTagClick: (tag: string) => void;
  filterTags: string[];
  onToggleImportant: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onToggleCompleted: (note: Note) => void;
  tags: Tag[];
};

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  theme,
  onEdit,
  onDelete,
  searchQuery,
  onTagClick,
  filterTags,
  onToggleImportant,
  onTogglePinned,
  onToggleCompleted,
  tags,
}) => {
  const now = new Date();
  let deadlineBorderClass = "";
  if (note.deadline) {
    const deadlineDate = new Date(note.deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (timeDiff < 0) {
      deadlineBorderClass = "border border-3 border-danger";
    } else if (timeDiff <= oneDayMs) {
      deadlineBorderClass = "border border-3 border-warning";
    }
  }
  // タグバッジの中
  const getTextColorForBackground = (bgColor: string) => {
    // 明るさをざっくり計算（RGB加重平均）
    const r = parseInt(bgColor.slice(1, 3), 16);
    const g = parseInt(bgColor.slice(3, 5), 16);
    const b = parseInt(bgColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? "#000" : "#fff";
  };

  return (
    <Card
      className={`mb-3 h-100 shadow-sm card-hover d-flex flex-column ${theme}-theme ${
        note.isPinned ? "pinned" : ""
      } ${note.isImportant ? "important" : ""} ${
        note.isCompleted ? "note-completed" : ""
      } ${deadlineBorderClass}`}
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
          {note.tags ? (
            note.tags.split(",").map((tagName, index) => {
              const trimmedTag = tagName.trim();
              const matchedTag = tags.find((t) => t.name === trimmedTag);

              const bgColor = matchedTag?.color || "#6c757d"; // タグの色がなければグレー
              // タグループ部分
              const textColor = getTextColorForBackground(bgColor);

              return (
                <span
                  key={index}
                  className="badge me-1"
                  style={{
                    cursor: "pointer",
                    backgroundColor: bgColor,
                    color: textColor,
                  }}
                  onClick={() => onTagClick(trimmedTag)}
                >
                  {trimmedTag}
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

        <div className="mt-2" style={{ minHeight: "1.8rem" }}>
          {note.deadline ? (
            <span
              className={`badge ${
                new Date(note.deadline) < new Date()
                  ? "bg-danger"
                  : "bg-warning text-dark"
              }`}
            >
              {new Date(note.deadline) < new Date() ? "⚠️ " : ""}
              締切: {format(parseISO(note.deadline), "yyyy/MM/dd HH:mm")}
            </span>
          ) : (
            <span className="invisible">締切: 0000/00/00 00:00</span>
          )}
        </div>
        {/* 締切と作成日時 */}
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
            variant={
              note.isImportant
                ? ""
                : theme === "dark"
                ? "outline-warning"
                : "outline-warning"
            }
            size="sm"
            className={`me-2 ${note.isImportant ? "btn-important-active" : ""}`}
            onClick={() => onToggleImportant(note)}
          >
            ⭐
          </Button>
          <Button
            variant={
              note.isPinned
                ? ""
                : theme === "dark"
                ? "outline-danger"
                : "outline-danger"
            }
            size="sm"
            className={`me-2 ${note.isPinned ? "btn-pinned-active" : ""}`}
            onClick={() => onTogglePinned(note)}
          >
            📌
          </Button>
          <Button
            variant={
              note.isCompleted
                ? ""
                : theme === "dark"
                ? "outline-success"
                : "outline-success"
            }
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

export default NoteCard;
