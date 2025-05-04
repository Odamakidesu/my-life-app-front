import React from "react";
type HighlightedTextProps = {
  text: string;
  query: string;
};

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  const regex = new RegExp(`(${query})`, "gi"); // 大文字小文字無視
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="custom-highlight">
            {part}
          </mark> // ヒット部分だけハイライト
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
};

export default HighlightedText;
