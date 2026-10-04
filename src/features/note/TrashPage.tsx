import React, { useCallback } from "react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { format } from "date-fns-tz";
import { parseISO } from "date-fns";
import { useTrash } from "features/note/hooks/useTrash";
import { tagNamesOf } from "features/note/logic";
import { NoteId } from "features/note/types/types";
import { ThemeName } from "shared/types/theme";
import ToastNotifier from "shared/components/ToastNotifier";
import { useToast } from "shared/hooks/useToast";

type TrashPageProps = {
  theme: ThemeName;
};

const formatDateTime = (value: string): string =>
  format(parseISO(value), "yyyy/MM/dd HH:mm");

/** ゴミ箱画面。削除したメモの復元と完全削除を行う */
const TrashPage: React.FC<TrashPageProps> = ({ theme }) => {
  const { message, variant, isVisible, showToast, hideToast } = useToast();
  const { notes, isLoading, restore, deletePermanently } = useTrash(showToast);

  const handleDeletePermanently = useCallback(
    async (id: NoteId) => {
      if (!window.confirm("完全に削除します。元に戻せませんがよろしいですか？")) return;
      await deletePermanently(id);
    },
    [deletePermanently]
  );

  return (
    <div className="container mt-4" data-bs-theme={theme}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">ゴミ箱</h2>
        <Link to="/notes" className="btn btn-outline-primary">
          メモ一覧へ戻る
        </Link>
      </div>

      {isLoading ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "40vh" }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <p className="text-muted">ゴミ箱は空です。</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {notes.map((note) => (
            <div className="col" key={note.id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title>{note.title}</Card.Title>
                  <Card.Text style={{ whiteSpace: "pre-wrap" }}>{note.content}</Card.Text>
                  {tagNamesOf(note).length > 0 && (
                    <p className="small text-muted mb-1">
                      タグ: {tagNamesOf(note).join("、")}
                    </p>
                  )}
                  <p className="small text-muted mb-0">
                    作成: {formatDateTime(note.createdAt)}
                  </p>
                </Card.Body>
                <Card.Footer className="d-flex justify-content-end gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => void restore(note.id)}
                  >
                    復元
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => void handleDeletePermanently(note.id)}
                  >
                    完全に削除
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          ))}
        </div>
      )}

      <ToastNotifier
        message={message}
        variant={variant}
        isVisible={isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default TrashPage;
