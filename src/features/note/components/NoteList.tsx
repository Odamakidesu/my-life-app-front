import React from "react";
import { Note } from "features/note/types/types";
import { Tag } from "features/tag/types/types";
import NoteCard from "features/note/components/NoteCard";

type NoteListProps = {
  notes: Note[];
  /** 絞り込み前の全件数（空表示のメッセージ切り替えに使う） */
  totalCount: number;
  tags: Tag[];
  searchQuery: string;
  onEdit: (note: Note) => void;
  onDelete: (id: number) => void;
  onTagClick: (tag: string) => void;
  onToggleImportant: (note: Note) => void;
  onTogglePinned: (note: Note) => void;
  onToggleCompleted: (note: Note) => void;
};

/** メモカードの一覧表示（アニメーション付き） */
const NoteList: React.FC<NoteListProps> = ({
  notes,
  totalCount,
  tags,
  searchQuery,
  onEdit,
  onDelete,
  onTagClick,
  onToggleImportant,
  onTogglePinned,
  onToggleCompleted,
}) => {
  if (notes.length === 0) {
    return (
      <div className="text-center mt-5">
        {totalCount === 0 ? (
          <>
            <h5>まだメモがありません！</h5>
            <p>メモを追加してみましょう！</p>
          </>
        ) : (
          <>
            <h5>メモが見つかりませんでした</h5>
            <p>別のキーワードで検索してみましょう！</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="row">
      {notes.map((note) => (
        <div key={note.id} className="col-md-4 mb-3">
          <NoteCard
            note={note}
            tags={tags}
            searchQuery={searchQuery}
            onEdit={onEdit}
            onDelete={onDelete}
            onTagClick={onTagClick}
            onToggleImportant={onToggleImportant}
            onTogglePinned={onTogglePinned}
            onToggleCompleted={onToggleCompleted}
          />
        </div>
      ))}
    </div>
  );
};

export default NoteList;
