import React, { useCallback, useMemo, useState } from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { Button, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth, useCurrentUser } from "features/auth/hooks/useAuth";
import { useNotes } from "features/note/hooks/useNotes";
import { useTags } from "features/tag/hooks/useTags";
import {
  DueFilter,
  Note,
  NoteFilterOptions,
  NoteSort,
} from "features/note/types/types";
import { emptyFilterOptions, toNoteQuery } from "features/note/logic";
import { NoteInput, emptyNoteInput } from "features/note/types/schema";
import { ThemeName } from "shared/types/theme";
import ToastNotifier from "shared/components/ToastNotifier";
import ActiveTagFilters from "features/note/components/ActiveTagFilters";
import NoteFilterPanel from "features/note/components/NoteFilterPanel";
import NoteForm, { toNoteInput } from "features/note/components/NoteForm";
import NoteList from "features/note/components/NoteList";
import NoteSearchBar from "features/note/components/NoteSearchBar";
import NoteToolbar from "features/note/components/NoteToolbar";
import { useToast } from "shared/hooks/useToast";
import { useDebouncedValue } from "shared/hooks/useDebouncedValue";

type NotesPageProps = {
  theme: ThemeName;
};

/** 検索語をサーバへ送るまでの待ち時間。打鍵のたびに要求しないため */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * メモ一覧画面。
 * 入力値の検証は NoteForm（= ドメインのスキーマ）に任せ、
 * この画面は「どの条件で表示するか」と「どのユースケースを呼ぶか」だけを持つ。
 * 絞り込みと並べ替えはサーバが行う。
 */
const NotesPage: React.FC<NotesPageProps> = ({ theme }) => {
  const { message, variant, isVisible, showToast, hideToast } = useToast();

  const [filters, setFilters] = useState<NoteFilterOptions>(emptyFilterOptions);
  const [sort, setSort] = useState<NoteSort>("PRIORITY");
  const [due, setDue] = useState<DueFilter | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // useNotes は query の参照が変わるたびに取り直すので、条件が変わったときだけ作り直す
  const query = useMemo(
    () => toNoteQuery(filters, debouncedQuery, sort, due),
    [filters, debouncedQuery, sort, due]
  );

  const {
    notes,
    total,
    summary,
    hasMore,
    isLoading,
    isDeleting,
    loadMore,
    addNote,
    saveNote,
    deleteNote,
    toggleImportant,
    togglePinned,
    toggleCompleted,
    exportNotes,
  } = useNotes(showToast, query);
  const { tags } = useTags(showToast);
  const { logout } = useAuth();
  const currentUser = useCurrentUser();

  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const updateFilters = useCallback((patch: Partial<NoteFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  /** 編集中なら更新、そうでなければ新規作成 */
  const handleSubmitNote = useCallback(
    async (values: NoteInput): Promise<boolean> => {
      const succeeded = editingNote
        ? await saveNote(editingNote.id, values)
        : await addNote(values);

      if (succeeded) setEditingNote(null);
      return succeeded;
    },
    [editingNote, saveNote, addNote]
  );

  const handleDeleteNote = useCallback(
    async (id: number) => {
      if (!window.confirm("メモをゴミ箱に移動しますか？（ゴミ箱から復元できます）")) return;

      const succeeded = await deleteNote(id);
      if (succeeded) setEditingNote(null);
    },
    [deleteNote]
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

  const handleLogout = async () => {
    await logout();
    window.location.href = "/"; // ルートにリダイレクト（リロードで状態リセット）
  };

  // 初回の読み込み中だけ一覧を差し替える。「もっと見る」や更新後の取り直しでは
  // 表示中のカードを残し、スクロール位置が先頭に飛ばないようにする。
  const showSpinner = (isLoading && notes.length === 0) || isDeleting;

  return (
    <div className="container mt-4" data-bs-theme={theme}>
      <div className="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-4">
        <Link to="/tags" className="btn btn-outline-secondary">
          タグ管理
        </Link>
        <Link to="/trash" className="btn btn-outline-secondary">
          ゴミ箱
        </Link>
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="export-menu">
            エクスポート
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => void exportNotes("csv")}>
              CSV（表計算ソフト向け）
            </Dropdown.Item>
            <Dropdown.Item onClick={() => void exportNotes("json")}>JSON</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Link to="/account" className="btn btn-outline-secondary">
          アカウント
        </Link>
        {currentUser?.role === "ADMIN" && (
          <Link to="/admin" className="btn btn-outline-secondary">
            管理画面
          </Link>
        )}
        <Button
          variant="outline-danger"
          className="d-flex align-items-center"
          onClick={() => void handleLogout()}
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

      <NoteToolbar
        sort={sort}
        onSortChange={setSort}
        summary={summary}
        due={due}
        onDueChange={setDue}
        matchedCount={total}
      />

      {/* メモリスト */}
      <div className="container">
        {showSpinner ? (
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "40vh" }}
          >
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">読み込み中...</span>
            </div>
          </div>
        ) : (
          <>
            <NoteList
              notes={notes}
              totalCount={summary.total}
              tags={tags}
              searchQuery={debouncedQuery}
              onEdit={setEditingNote}
              onDelete={handleDeleteNote}
              onTagClick={handleTagClick}
              onToggleImportant={toggleImportant}
              onTogglePinned={togglePinned}
              onToggleCompleted={toggleCompleted}
            />
            {hasMore && (
              <div className="text-center mb-4">
                <Button variant="outline-primary" onClick={loadMore} disabled={isLoading}>
                  {isLoading ? "読み込み中..." : `もっと見る（残り ${total - notes.length}件）`}
                </Button>
              </div>
            )}
          </>
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
