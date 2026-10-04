import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { TagDraft } from "features/tag/types/types";

type TagEditorProps = {
  initial: TagDraft;
  submitLabel: string;
  /** 成功したら true。新規作成フォームは成功時に入力を空に戻す */
  onSubmit: (draft: TagDraft) => Promise<boolean>;
  onCancel?: () => void;
  resetOnSuccess?: boolean;
};

/** タグ名と色の入力欄。検証はサービス層（tagDraftSchema）に任せる */
const TagEditor: React.FC<TagEditorProps> = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSuccess = false,
}) => {
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const succeeded = await onSubmit({ name, color });
      if (succeeded && resetOnSuccess) {
        setName(initial.name);
        setColor(initial.color);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form className="d-flex flex-wrap align-items-center gap-2" onSubmit={handleSubmit}>
      <Form.Control
        type="text"
        aria-label="タグ名"
        placeholder="タグ名"
        maxLength={50}
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ maxWidth: "240px" }}
      />
      <Form.Control
        type="color"
        aria-label="タグの色"
        title="タグの色"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
        {submitLabel}
      </Button>
      {onCancel && (
        <Button variant="outline-secondary" size="sm" onClick={onCancel}>
          キャンセル
        </Button>
      )}
    </Form>
  );
};

export default TagEditor;
