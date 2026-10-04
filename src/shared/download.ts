/**
 * Blob をファイルとして保存させる（ブラウザのダウンロード）。
 * 作った URL はすぐに解放する。持ち続けると Blob がページを閉じるまでメモリに残る。
 */
export const saveBlob = (content: Blob, fileName: string): void => {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
