import React, { useEffect, useState, useRef } from "react";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import NoteCard from "../components/NoteCard";
import CreateNoteForm from "../components/CreateNoteForm";
import EditNoteForm from "../components/EditNoteForm";
import { format } from "date-fns-tz";
import { InputGroup, FormControl, Button, Form } from "react-bootstrap";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "../css/NotesPage.css";
import {
  fetchNotes,
  createNote,
  updateNote,
  updateNoteImportant,
  updateNotePinned,
  updateNoteCompleted,
  updateNoteDelete,
} from "../api/notes";
import { fetchTags } from "../api/tags";
//note.tsのステータス
type Note = {
  id: number;
  title: string;
  content: string;
  created_at: string;
  tags?: string;
  isImportant?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  deadline?: string;
  delete_flg?: boolean;
};
//tags.tsのステータス
type Tag = {
  id: number;
  name: string;
  color: string;
};

type NotesPageProps = {
  theme: "light" | "dark";
};

const NotesPage: React.FC<NotesPageProps> = ({ theme }) => {
  const nodeRefs = useRef<Map<number, React.RefObject<HTMLDivElement | null>>>(
    new Map()
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingDeadline, setEditingDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState<
    "success" | "danger" | "info" | "warning"
  >("success");

  // タグフィルター機能
  const [searchQuery, setSearchQuery] = useState("");
  const [formSelectedTags, setFormSelectedTags] = useState<string[]>([]);
  const [editingFormSelectedTags, setEditingFormSelectedTags] = useState<
    string[]
  >([]);

  // フィルタ用は別！
  const [filterTags, setFilterTags] = useState<string[]>([]);
  // 完了済フィルター

  const [filterPinned, setFilterPinned] = useState(false);
  const [filterImportant, setFilterImportant] = useState(false);
  const [filterCompleted, setFilterCompleted] = useState(true);
  const [filterUncompleted, setFilterUncompleted] = useState(true);

  // メモ取得
  // アプリ起動時にfetchNotesするやつ
  useEffect(() => {
    const fetchNotesData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchNotes();
        const sortedNotes = data.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotes(sortedNotes);
      } catch (error) {
        console.error("メモ取得失敗", error);
        showToastMessage("メモの取得に失敗しました", "danger");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotesData();
  }, []);

  useEffect(() => {
    const fetchTagsData = async () => {
      try {
        const data = await fetchTags();
        setTags(data);
      } catch (error) {
        console.error("タグ取得失敗", error);
        // showToastMessage("タグの取得に失敗しました", "danger");
      }
    };

    fetchTagsData();
  }, []);

  const handleFetchNotes = async () => {
    setIsLoading(true);
    try {
      const data = await fetchNotes();
      const sortedNotes = data.sort((a, b) => {
        // まず重要なメモを上に
        if ((a.isPinned ? 1 : 0) !== (b.isPinned ? 1 : 0)) {
          return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
        }

        // 重要度が同じなら、ピン留めの有無でソート
        if ((a.isImportant ? 1 : 0) !== (b.isImportant ? 1 : 0)) {
          return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
        }

        // 重要度が同じなら、作成日時の新しい順
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      setNotes(sortedNotes);
    } catch (error) {
      console.error("メモ取得失敗", error);
      showToastMessage("メモの取得に失敗しました", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  // 新規メモ追加
  const handleAddNote = async () => {
    const error = validateNoteInput(newTitle, newNote);
    if (error) {
      showToastMessage(error, "danger");
      return;
    }

    const tagsArray = newTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "")
      .join(",");

    const created_at = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
    try {
      // 新しいメモを作成
      // DBに保存してレスポンスを受け取る
      const newNoteFromServer = await createNote(
        newTitle,
        newNote,
        tagsArray,
        created_at,
        newDeadline || ""
      );

      // ローカルStateに追加（DBから返った正しいデータ）
      setNotes((prevNotes) => [newNoteFromServer, ...prevNotes]);

      resetFormState(); // 入力・編集状態をリセット
      showToastMessage("メモを追加しました", "success");
    } catch (error) {
      console.error("メモ追加失敗", error);
      showToastMessage("メモの追加に失敗しました", "danger");
    }
  };

  // メモ編集
  const handleEditNote = (note: Note) => {
    setEditingNote(note); // 編集する対象をセット
    setEditingTitle(note.title); // 入力欄に元の内容を入れる
    setEditingContent(note.content);
    setEditingTags(note.tags ? note.tags : "");
    setEditingDeadline(note.deadline ? note.deadline : "");
    setEditingFormSelectedTags(
      note.tags ? note.tags.split(",").map((tag) => tag.trim()) : []
    ); // タグをカンマ区切りで分割してセット
  };

  // メモ更新保存
  const handleSaveNote = async () => {
    if (!editingNote) return;
    const error = validateNoteInput(editingTitle, editingContent);
    if (error) {
      showToastMessage(error, "danger");
      return;
    }
    try {
      await updateNote(
        editingNote.id,
        editingTitle,
        editingContent,
        editingTags,
        editingDeadline || ""
      );
      resetFormState(); // 入力・編集状態をリセット
      showToastMessage("メモを更新しました", "success");
      handleFetchNotes();
    } catch (error) {
      console.error("メモ更新失敗", error);
      showToastMessage("メモの更新に失敗しました", "danger");
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!window.confirm("本当に削除しますか？")) return;
    setIsDeleting(true);
    try {
      await updateNoteDelete(id);
      resetFormState(); // 入力・編集状態をリセット
      showToastMessage("メモを削除しました", "success");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id)); // 削除
    } catch (error) {
      console.error("メモ削除失敗", error);
      showToastMessage("メモの削除に失敗しました", "danger");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTagClick = (tag: string) => {
    setFilterTags(
      (prevTags) =>
        prevTags.includes(tag)
          ? prevTags.filter((t) => t !== tag) // クリック済みなら解除
          : [...prevTags, tag] // クリックされてなければ追加
    );
  };

  const handleToggleImportant = async (note: Note) => {
    try {
      await updateNoteImportant(note.id, !note.isImportant);
      showToastMessage(
        note.isImportant ? "スターを解除しました" : "スターしました",
        "success"
      );
      handleFetchNotes(); // 更新後に再取得
    } catch (error) {
      console.error("スター切り替え失敗", error);
      showToastMessage("スター切り替えに失敗しました", "danger");
    }
  };

  const handleTogglePinned = async (note: Note) => {
    try {
      await updateNotePinned(note.id, !note.isPinned);
      showToastMessage(
        note.isPinned ? "ピン留めを解除しました" : "ピン留めしました",
        "success"
      );
      handleFetchNotes(); // 更新後に再取得
    } catch (error) {
      console.error("ピン留め切り替え失敗", error);
      showToastMessage("ピン留め切り替えに失敗しました", "danger");
    }
  };

  const handleToggleCompleted = async (note: Note) => {
    try {
      await updateNoteCompleted(note.id, !note.isCompleted);
      showToastMessage(
        note.isCompleted ? "未完了に戻しました" : "完了済みにしました",
        "success"
      );
      handleFetchNotes();
    } catch (error) {
      console.error("完了切り替え失敗", error);
      showToastMessage("完了状態の変更に失敗しました", "danger");
    }
  };

  // メモの保存が成功したらトーストを表示する
  const showToastMessage = (
    message: string,
    variant: "success" | "danger" | "info" | "warning"
  ) => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
    }
    if (a.isImportant !== b.isImportant) {
      return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const filteredNotes = sortedNotes
    .filter((note) => {
      // 重要度フィルター
      const matchesPinned = filterPinned ? note.isPinned : true;
      const matchesImportant = filterImportant ? note.isImportant : true;
      return matchesPinned && matchesImportant;
    })
    .filter((note) => {
      // 完了・未完了フィルター
      const showCompleted = filterCompleted;
      const showUncompleted = filterUncompleted;

      if (showCompleted && showUncompleted) return true; // 両方ONなら全件表示
      if (showCompleted) return note.isCompleted;
      if (showUncompleted) return !note.isCompleted;
      return true; // 両方OFFのときも全件表示（仕様上）
    })
    .filter((note) => {
      const titleMatch = note.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const contentMatch = note.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const searchMatch = titleMatch || contentMatch;

      const tagMatch =
        filterTags.length > 0
          ? note.tags
            ? filterTags.every((selected) =>
                (note.tags ?? "")
                  .split(",")
                  .some(
                    (tag) => tag.trim().toLowerCase() === selected.toLowerCase()
                  )
              )
            : false
          : true;

      return searchMatch && tagMatch;
    });

  // 表示するのはsortedNotesに変更
  sortedNotes.map((note) => (
    <NoteCard
      key={note.id}
      note={note}
      theme={theme}
      onEdit={handleEditNote}
      onDelete={handleDeleteNote}
      searchQuery={searchQuery}
      onTagClick={handleTagClick}
      filterTags={filterTags}
      onToggleImportant={handleToggleImportant}
      onTogglePinned={handleTogglePinned}
      onToggleCompleted={handleToggleCompleted}
      tags={tags}
    />
  ));

  // 入力・編集状態をリセットする共通メソッド
  const resetFormState = () => {
    setNewTitle("");
    setNewNote("");
    setNewTags("");
    setNewDeadline("");
    setFormSelectedTags([]);
    setEditingNote(null);
    setEditingTitle("");
    setEditingContent("");
    setEditingTags("");
    setEditingDeadline("");
    setEditingFormSelectedTags([]);
    setFilterTags([]);
  };

  // バリデーションチェック
  const validateNoteInput = (title: string, content: string): string | null => {
    if (!title.trim() || !content.trim()) {
      return "タイトルと本文を入力してください！";
    }
    if (title.length > 50) {
      return "タイトルは50文字以内にしてください！";
    }
    if (content.length > 500) {
      return "本文は500文字以内にしてください！";
    }
    return null; // 問題なし
  };

  // ライトモード・ダークモードの切り替え
  useEffect(() => {
    // まずbodyの古いクラスをリセット
    document.body.classList.remove("light-theme", "dark-theme");
    // 新しいクラスを付与
    document.body.classList.add(
      theme === "dark" ? "dark-theme" : "light-theme"
    );
  }, [theme]);

  // ログアウト処理
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // ルートにリダイレクト（リロードで状態リセット）
  };

  return (
    <div className={"container mt-4"}>
      <div className="d-flex justify-content-end align-items-center mb-4">
        <Button
          variant="outline-danger"
          className="d-flex align-items-center"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          ログアウト
        </Button>
      </div>
      {isLoading || isDeleting ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "60vh" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      ) : (
        <>
          <h2>検索フォーム</h2>
          <div className="mb-4">
            <InputGroup>
              <FormControl
                placeholder="メモを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline-primary"
                onClick={() => {
                  /* 必要なら検索ボタンに機能追加 */
                }}
              >
                検索
              </Button>
            </InputGroup>
          </div>
          <div className="sticky-tags-wrapper mb-4">
            {filterTags.length > 0 && (
              <div className="alert alert-primary d-flex flex-wrap align-items-center justify-content-between p-3">
                <div className="d-flex flex-wrap">
                  {filterTags.map((tag, index) => (
                    <span
                      key={index}
                      className="badge bg-primary d-flex align-items-center me-2 mb-2"
                      style={{ fontSize: "1rem", cursor: "pointer" }}
                    >
                      {tag}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        aria-label="Close"
                        style={{ fontSize: "0.6rem" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterTags((prev) =>
                            prev.filter((t) => t !== tag)
                          );
                        }}
                      />
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => setFilterTags([])}
                >
                  フィルター解除
                </Button>
              </div>
            )}
          </div>
          <h2>メモ一覧</h2>
          {/* 入力フォーム */}
          <div className={"note-form-wrapper"}>
            {editingNote ? (
              <EditNoteForm
                editingTitle={editingTitle}
                editingContent={editingContent}
                editingTags={editingTags}
                editingDeadline={editingDeadline}
                editingFormSelectedTags={editingFormSelectedTags}
                setEditingTitle={setEditingTitle}
                setEditingContent={setEditingContent}
                setEditingTags={setEditingTags}
                setEditingDeadline={setEditingDeadline}
                setEditingFormSelectedTags={setEditingFormSelectedTags}
                handleSaveNote={handleSaveNote}
                cancelEdit={() => setEditingNote(null)}
                tags={tags}
              />
            ) : (
              <CreateNoteForm
                newTitle={newTitle}
                newNote={newNote}
                newTags={newTags}
                newDeadline={newDeadline}
                formSelectedTags={formSelectedTags}
                setNewTitle={setNewTitle}
                setNewNote={setNewNote}
                setNewTags={setNewTags}
                setNewDeadline={setNewDeadline}
                setFormSelectedTags={setFormSelectedTags}
                handleAddNote={handleAddNote}
                tags={tags}
              />
            )}
          </div>
          {/* メモリスト */}
          {/* ソート変更用のセレクトボックス */}
          <div className="mb-4 d-flex flex-wrap gap-4">
            <div
              className="card shadow-sm border-primary"
              style={{ minWidth: "260px" }}
            >
              <div className="card-header bg-primary text-white d-flex align-items-center">
                <i className="bi bi-funnel-fill me-2"></i>
                <span>重要度フィルター</span>
              </div>
              <div className="card-body d-flex justify-content-around">
                <Form.Check
                  type="switch"
                  id="filter-pinned"
                  label="📌 ピン留め"
                  checked={filterPinned}
                  onChange={(e) => setFilterPinned(e.target.checked)}
                />
                <Form.Check
                  type="switch"
                  id="filter-important"
                  label="⭐ スター付き"
                  checked={filterImportant}
                  onChange={(e) => setFilterImportant(e.target.checked)}
                />
              </div>
            </div>

            <div
              className="card shadow-sm border-success"
              style={{ minWidth: "260px" }}
            >
              <div className="card-header bg-success text-white d-flex align-items-center">
                <i className="bi bi-check2-square me-2"></i>
                <span>完了状態フィルター</span>
              </div>
              <div className="card-body d-flex justify-content-around">
                <Form.Check
                  type="switch"
                  id="filter-completed"
                  label="✅ 完了済み"
                  checked={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.checked)}
                />
                <Form.Check
                  type="switch"
                  id="filter-uncompleted"
                  label="⏳ 未完了"
                  checked={filterUncompleted}
                  onChange={(e) => setFilterUncompleted(e.target.checked)}
                />
              </div>
            </div>
          </div>
          <div className="container">
            {filteredNotes.length === 0 ? (
              <div className="text-center mt-5">
                {notes.length === 0 ? (
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
            ) : (
              <TransitionGroup className="row">
                {filteredNotes.map((note) => {
                  let reactRef = nodeRefs.current.get(note.id);
                  if (!reactRef) {
                    reactRef = React.createRef<HTMLDivElement>();
                    nodeRefs.current.set(note.id, reactRef);
                  }
                  return (
                    <CSSTransition
                      key={note.id}
                      nodeRef={reactRef}
                      timeout={300}
                      classNames="fade"
                    >
                      <div
                        ref={(el) => {
                          if (el) reactRef!.current = el;
                        }}
                        className="col-md-4 mb-3"
                      >
                        <NoteCard
                          note={note}
                          theme={theme}
                          onEdit={handleEditNote}
                          onDelete={handleDeleteNote}
                          searchQuery={searchQuery}
                          onTagClick={handleTagClick}
                          filterTags={filterTags}
                          onToggleImportant={handleToggleImportant}
                          onTogglePinned={handleTogglePinned}
                          onToggleCompleted={handleToggleCompleted}
                          tags={tags}
                        />
                      </div>
                    </CSSTransition>
                  );
                })}
              </TransitionGroup>
            )}
          </div>
          <ToastContainer position="bottom-end" className="p-3 fixed-toast">
            <Toast
              onClose={() => setShowToast(false)}
              show={showToast}
              delay={2000}
              autohide
              bg={toastVariant}
            >
              <Toast.Body className="text-white">{toastMessage}</Toast.Body>
            </Toast>
          </ToastContainer>
        </>
      )}
    </div>
  );
};

export default NotesPage;
