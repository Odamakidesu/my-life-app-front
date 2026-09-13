import React from "react";
import { Button } from "react-bootstrap";

type ActiveTagFiltersProps = {
  tags: string[];
  onRemove: (tag: string) => void;
  onClear: () => void;
};

/** 現在適用中のタグフィルターの表示と解除 */
const ActiveTagFilters: React.FC<ActiveTagFiltersProps> = ({
  tags,
  onRemove,
  onClear,
}) => (
  <div className="sticky-tags-wrapper mb-4">
    {tags.length > 0 && (
      <div className="alert alert-primary d-flex flex-wrap align-items-center justify-content-between p-3">
        <div className="d-flex flex-wrap">
          {tags.map((tag, index) => (
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
                  onRemove(tag);
                }}
              />
            </span>
          ))}
        </div>
        <Button variant="outline-danger" size="sm" onClick={onClear}>
          フィルター解除
        </Button>
      </div>
    )}
  </div>
);

export default ActiveTagFilters;
