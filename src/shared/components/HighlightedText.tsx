import React from "react";
type HighlightedTextProps = {
  text: string;
  query: string;
};

/** 正規表現のメタ文字を打ち消し、検索語をリテラルとして扱えるようにする */
const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  // 検索語は利用者の生入力なので、エスケープせずに RegExp へ渡すと
  // "(" ひとつで SyntaxError になり、描画中の例外として画面全体が落ちる。
  let parts: string[];
  try {
    parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  } catch {
    return <>{text}</>;
  }

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
