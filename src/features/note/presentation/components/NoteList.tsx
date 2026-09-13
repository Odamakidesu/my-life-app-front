import React, { useRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { Note } from "features/note/domain/types/Note";
import { Tag } from "features/tag/domain/types/Tag";
import { ThemeName } from "shared/types/theme";
import NoteCard from "features/note/presentation/components/NoteCard";

type NoteListProps = {
  notes: Note[];
  /** 絞り込み前の全件数（空表示のメッセージ切り替えに使う） */
  totalCount: number;
  theme: ThemeName;
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
  theme,
  tags,
  searchQuery,
  onEdit,
  onDelete,
  onTagClick,
  onToggleImportant,
  onTogglePinned,
  onToggleCompleted,
}) => {
  const nodeRefs = useRef<Map<number, React.RefObject<HTMLDivElement | null>>>(
    new Map()
  );

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
    <TransitionGroup className="row">
      {notes.map((note) => {
        let nodeRef = nodeRefs.current.get(note.id);
        if (!nodeRef) {
          nodeRef = React.createRef<HTMLDivElement>();
          nodeRefs.current.set(note.id, nodeRef);
        }

        return (
          <CSSTransition
            key={note.id}
            nodeRef={nodeRef}
            timeout={300}
            classNames="fade"
          >
            <div
              ref={(el) => {
                if (el) nodeRef!.current = el;
              }}
              className="col-md-4 mb-3"
            >
              <NoteCard
                note={note}
                theme={theme}
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
          </CSSTransition>
        );
      })}
    </TransitionGroup>
  );
};

export default NoteList;
