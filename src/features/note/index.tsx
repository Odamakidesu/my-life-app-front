import React, {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Button } from "react-bootstrap";
import { useAuth } from "features/auth/hooks/useAuth";
import { useNotes } from "features/note/hooks/useNotes";
import { useTags } from "features/tag/hooks/useTags";
import { Note, NoteFilterOptions } from "features/note/types/types";
import {
  emptyFilterOptions,
  filterNotes,
} from "features/note/logic";
import { NoteInput, emptyNoteInput } from "features/note/types/schema";
import { sortByPriority } from "features/note/logic";
import { ThemeName } from "shared/types/theme";
import ToastNotifier from "shared/components/ToastNotifier";
import ActiveTagFilters from "features/note/components/ActiveTagFilters";
import NoteFilterPanel from "features/note/components/NoteFilterPanel";
import NoteForm, {
  toNoteInput,
} from "features/note/components/NoteForm";
import NoteList from "features/note/components/NoteList";
import NoteSearchBar from "features/note/components/NoteSearchBar";
import { useToast } from "shared/hooks/useToast";

type NotesPageProps = {
  theme: ThemeName;
};

/**
 * メモ一覧画面。
 * 入力値の検証は NoteForm（= ドメインのスキーマ）に任せ、
 * この画面は「何を表示するか」と「どのユースケースを呼ぶか」だけを持つ。
 */
const NotesPage: React.FC<NotesPageProps> = ({ theme }) => {
  const { message, variant, isVisible, showToast, hideToast } = useToast();
  const {
    notes,
    isLoading,
    isDeleting,
    addNote,
    saveNote,
    deleteNote,
    toggleImportant,
    togglePinned,
    toggleCompleted,
  } = useNotes(showToast);
  const { tags } = useTags(showToast);
  const { logout } = useAuth();

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [filters, setFilters] = useState<NoteFilterOptions>(emptyFilterOptions);

  // 検索キーワードは打鍵ごとに変わるので絞り込み条件とは別に持ち、
  // 一覧の再計算だけを遅延させて入力の引っかかりをなくす。
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const updateFilters = useCallback((patch: Partial<NoteFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const visibleNotes = useMemo(
    () =>
      filterNotes(sortByPriority(notes), {
        ...filters,
        searchQuery: deferredQuery,
      }),
    [notes, filters, deferredQuery]
  );

  /** 追加・更新・削除のあとに編集状態とタグフィルターを初期化する */
  const resetAfterMutation = useCallback(() => {
    setEditingNote(null);
    updateFilters({ tags: [] });
  }, [updateFilters]);

  /** 編集中なら更新、そうでなければ新規作成 */
  const handleSubmitNote = useCallback(
    async (values: NoteInput): Promise<boolean> => {
      const succeeded = editingNote
        ? await saveNote(editingNote.id, values)
        : await addNote(values);

      if (succeeded) resetAfterMutation();
      return succeeded;
    },
    [editingNote, saveNote, addNote, resetAfterMutation]
  );

  const handleDeleteNote = useCallback(
    async (id: number) => {
      if (!window.confirm("本当に削除しますか？")) return;

      const succeeded = await deleteNote(id);
      if (succeeded) resetAfterMutation();
    },
    [deleteNote, resetAfterMutation]
  );

  const handleTagClick = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag) // クリック済みなら解除
        : [...prev.tags, tag],
    }));
  }, []);

  const handleRemoveTagFilter = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleClearTagFilter = useCallback(
    () => updateFilters({ tags: [] }),
    [updateFilters]
  );

  const handleCancelEdit = useCallback(() => setEditingNote(null), []);

  const handleLogout = () => {
    logout();
    window.location.href = "/"; // ルートにリダイレクト（リロードで状態リセット）
  };

  return (
    <div className="container mt-4" data-bs-theme={theme}>
      <div className="d-flex justify-content-end align-items-center mb-4">
        <Button
          variant="outline-danger"
          className="d-flex align-items-center"
          onClick={handleLogout}
        >
          ログアウト
        </Button>
      </div>

      <h2>検索フォーム</h2>
      <NoteSearchBar value={searchQuery} onChange={setSearchQuery} />

      <ActiveTagFilters
        tags={filters.tags}
        onRemove={handleRemoveTagFilter}
        onClear={handleClearTagFilter}
      />

      <h2>メモ一覧</h2>
      {/*
        入力フォームは読み込み中でもアンマウントしない。
        フォームの値は NoteForm の内部（react-hook-form）にあるため、
        一覧の再取得のたびに差し替えると入力途中の内容が消える。
      */}
      <div className={"note-form-wrapper"}>
        <NoteForm
          key={editingNote ? `edit-${editingNote.id}` : "create"}
          mode={editingNote ? "edit" : "create"}
          defaultValues={editingNote ? toNoteInput(editingNote) : emptyNoteInput}
          tags={tags}
          onSubmit={handleSubmitNote}
          onCancel={handleCancelEdit}
        />
      </div>

      {/* 絞り込み */}
      <NoteFilterPanel filters={filters} onChange={updateFilters} />

      {/* メモリスト（読み込み中はこの領域だけを差し替える） */}
      <div className="container">
        {isLoading || isDeleting ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "40vh" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">読み込み中...</span>
            </div>
          </div>
        ) : (
          <NoteList
            notes={visibleNotes}
            totalCount={notes.length}
            tags={tags}
            searchQuery={deferredQuery}
            onEdit={setEditingNote}
            onDelete={handleDeleteNote}
            onTagClick={handleTagClick}
            onToggleImportant={toggleImportant}
            onTogglePinned={togglePinned}
            onToggleCompleted={toggleCompleted}
          />
        )}
      </div>

      {/* 通知は読み込み中でも隠れないようここに置く */}
      <ToastNotifier
        message={message}
        variant={variant}
        isVisible={isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default NotesPage;
