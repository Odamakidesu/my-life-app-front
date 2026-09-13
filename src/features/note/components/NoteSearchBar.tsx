import React from "react";
import { Button, FormControl, InputGroup } from "react-bootstrap";

type NoteSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

/** タイトル・本文に対する検索フォーム */
const NoteSearchBar: React.FC<NoteSearchBarProps> = ({ value, onChange }) => (
  <div className="mb-4">
    <InputGroup>
      <FormControl
        placeholder="メモを検索..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <Button
        variant="outline-primary"
        onClick={() => {
          /* 入力と同時に絞り込むため、ボタンでの明示的な検索は不要 */
        }}
      >
        検索
      </Button>
    </InputGroup>
  </div>
);

export default NoteSearchBar;
