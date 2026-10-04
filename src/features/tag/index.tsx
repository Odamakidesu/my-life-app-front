import React, { useCallback, useState } from "react";
import { Badge, Button, ListGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import TagEditor from "features/tag/components/TagEditor";
import { useTagManager } from "features/tag/hooks/useTagManager";
import { DEFAULT_TAG_COLOR, textColorForBackground } from "features/tag/logic";
import { Tag, TagDraft, TagId } from "features/tag/types/types";
import { ThemeName } from "shared/types/theme";
import ToastNotifier from "shared/components/ToastNotifier";
import { useToast } from "shared/hooks/useToast";

type TagsPageProps = {
  theme: ThemeName;
};

const emptyDraft: TagDraft = { name: "", color: DEFAULT_TAG_COLOR };

const TagChip: React.FC<{ tag: Tag }> = ({ tag }) => (
  <span
    className="badge rounded-pill"
    style={{
      backgroundColor: tag.color,
      color: textColorForBackground(tag.color),
    }}
  >
    {tag.name}
  </span>
);

/** タグ管理画面。自分のタグの追加・改名・色変更・削除を行う */
const TagsPage: React.FC<TagsPageProps> = ({ theme }) => {
  const { message, variant, isVisible, showToast, hideToast } = useToast();
  const { tags, isLoading, createTag, updateTag, removeTag } = useTagManager(showToast);
  const [editingId, setEditingId] = useState<TagId | null>(null);

  const handleUpdate = useCallback(
    async (id: TagId, draft: TagDraft) => {
      const succeeded = await updateTag(id, draft);
      if (succeeded) setEditingId(null);
      return succeeded;
    },
    [updateTag]
  );

  const handleRemove = useCallback(
    async (tag: Tag) => {
      if (
        !window.confirm(
          `タグ「${tag.name}」を削除しますか？（メモに付いたタグ名は残ります）`
        )
      )
        return;
      await removeTag(tag.id);
    },
    [removeTag]
  );

  return (
    <div className="container mt-4" data-bs-theme={theme}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">タグ管理</h2>
        <Link to="/notes" className="btn btn-outline-primary">
          メモ一覧へ戻る
        </Link>
      </div>

      <h5>タグを追加</h5>
      <div className="mb-4">
        <TagEditor
          initial={emptyDraft}
          submitLabel="追加"
          onSubmit={createTag}
          resetOnSuccess
        />
      </div>

      {isLoading ? (
        <div className="d-flex justify-content-center" style={{ minHeight: "20vh" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">読み込み中...</span>
          </div>
        </div>
      ) : (
        <ListGroup>
          {tags.map((tag) => (
            <ListGroup.Item
              key={tag.id}
              className="d-flex flex-wrap justify-content-between align-items-center gap-2"
            >
              {editingId === tag.id ? (
                <TagEditor
                  initial={{ name: tag.name, color: tag.color }}
                  submitLabel="保存"
                  onSubmit={(draft) => handleUpdate(tag.id, draft)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <TagChip tag={tag} />
                  {tag.editable ? (
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setEditingId(tag.id)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => void handleRemove(tag)}
                      >
                        削除
                      </Button>
                    </div>
                  ) : (
                    <Badge bg="secondary">共通タグ（編集不可）</Badge>
                  )}
                </>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
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

export default TagsPage;
