import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type MarkdownTextProps = {
  text: string;
};

/**
 * 外部へのリンクは新しいタブで開き、遷移先にこの画面を操作させない（noopener）。
 * メモの本文は利用者が自由に書けるので、リンク先は信頼できない前提で扱う。
 */
const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

/**
 * メモ本文の Markdown 表示。
 *
 * react-markdown は HTML を解釈せず文字として出し、javascript: などの危険な URL も無効化する。
 * dangerouslySetInnerHTML を使わないので、本文にタグを書かれても画面にスクリプトは入らない。
 * 改行はそのまま改行として表示する（remark-breaks）。Markdown を知らない人が書いた
 * 改行入りのメモが、1 行につながって見えないようにするため。
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => (
  <div className="note-markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {text}
    </ReactMarkdown>
  </div>
);

export default MarkdownText;
